from datetime import datetime, time, timedelta
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nirantar.config import get_settings
from nirantar.models.meals import FoodItem, Meal
from nirantar.schemas.meals import (
    AddFoodItemOperation,
    FoodItemCreate,
    FoodItemRead,
    MealCreate,
    MealDeleteRequest,
    MealDeleteResult,
    MealEditRequest,
    MealHistoryQuery,
    MealHistoryRead,
    MealRead,
    RemoveFoodItemOperation,
    UpdateFoodItemOperation,
    UpdateMealOperation,
)
from nirantar.services.errors import (
    ConflictDomainError,
    NotFoundError,
    ValidationDomainError,
)


def _to_food_item_read(item: FoodItem) -> FoodItemRead:
    return FoodItemRead(
        id=item.id,
        order=item.item_order,
        name=item.name,
        quantity=item.quantity,
        unit=item.unit,
        calories_kcal=item.calories_kcal,
        protein_g=item.protein_g,
        carbohydrates_g=item.carbohydrates_g,
        fat_g=item.fat_g,
        notes=item.notes,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _to_meal_read(meal: Meal) -> MealRead:
    return MealRead(
        id=meal.id,
        eaten_at=meal.eaten_at,
        name=meal.name,
        notes=meal.notes,
        items=[
            _to_food_item_read(item)
            for item in sorted(meal.items, key=lambda value: value.item_order)
        ],
        created_at=meal.created_at,
        updated_at=meal.updated_at,
    )


def _new_food_item(
    payload: FoodItemCreate,
    *,
    order: int,
) -> FoodItem:
    return FoodItem(
        item_order=order,
        name=payload.name,
        quantity=payload.quantity,
        unit=payload.unit,
        calories_kcal=payload.calories_kcal,
        protein_g=payload.protein_g,
        carbohydrates_g=payload.carbohydrates_g,
        fat_g=payload.fat_g,
        notes=payload.notes,
    )


class MealService:
    """Shared aggregate meal operations for FastAPI and MCP."""

    def __init__(
        self,
        session: AsyncSession,
        *,
        user_timezone: str | None = None,
    ) -> None:
        self.session = session
        self.user_timezone = user_timezone or get_settings().user_timezone

    async def log_meal(self, payload: MealCreate) -> MealRead:
        meal = Meal(
            eaten_at=payload.eaten_at,
            name=payload.name,
            notes=payload.notes,
        )
        meal.items = [
            _new_food_item(item, order=order)
            for order, item in enumerate(payload.items, start=1)
        ]
        self.session.add(meal)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                "Meal could not be saved due to a data constraint violation"
            ) from exc
        except Exception:
            await self.session.rollback()
            raise

        meal_id = meal.id
        self.session.expire_all()
        return _to_meal_read(await self._get_meal(meal_id))

    async def get_meal(self, meal_id: UUID) -> MealRead:
        self.session.expire_all()
        return _to_meal_read(await self._get_meal(meal_id))

    async def get_meals(self, query: MealHistoryQuery) -> MealHistoryRead:
        timezone = ZoneInfo(self.user_timezone)
        start_at = datetime.combine(query.start_date, time.min, tzinfo=timezone)
        end_at = datetime.combine(
            query.end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone,
        )
        result = await self.session.scalars(
            select(Meal)
            .where(Meal.eaten_at >= start_at, Meal.eaten_at < end_at)
            .options(selectinload(Meal.items))
            .order_by(Meal.eaten_at.asc(), Meal.id.asc())
            .limit(query.limit)
        )
        meals = [_to_meal_read(meal) for meal in result.all()]
        return MealHistoryRead(
            start_date=query.start_date,
            end_date=query.end_date,
            meal_count=len(meals),
            meals=meals,
        )

    async def edit_meal(
        self,
        meal_id: UUID,
        payload: MealEditRequest,
    ) -> MealRead:
        try:
            meal = await self._get_meal(meal_id, for_update=True)
            self._require_current_version(meal, payload.expected_updated_at)
            items = {item.id: item for item in meal.items}
            self._validate_operation_conflicts(payload, items)

            removed_ids = {
                operation.item_id
                for operation in payload.operations
                if isinstance(operation, RemoveFoodItemOperation)
            }
            final_orders: dict[object, int] = {
                item_id: item.item_order
                for item_id, item in items.items()
                if item_id not in removed_ids
            }
            for index, operation in enumerate(payload.operations):
                if isinstance(operation, UpdateFoodItemOperation):
                    self._item_in_meal(items, operation.item_id)
                    if "order" in operation.model_fields_set:
                        final_orders[operation.item_id] = operation.order
                elif isinstance(operation, AddFoodItemOperation):
                    final_orders[("new", index)] = operation.order
                elif isinstance(operation, RemoveFoodItemOperation):
                    self._item_in_meal(items, operation.item_id)

            if not final_orders:
                raise ValidationDomainError("A meal must contain at least one food item")
            if len(final_orders.values()) != len(set(final_orders.values())):
                raise ValidationDomainError(
                    "Food item order values must be unique within a meal"
                )

            stage_base = max([item.item_order for item in meal.items] + [0]) + len(
                meal.items
            ) + 100
            for index, item in enumerate(meal.items, start=1):
                item.item_order = stage_base + index
            await self.session.flush()

            for item_id, item in items.items():
                if item_id not in removed_ids:
                    item.item_order = final_orders[item_id]

            for index, operation in enumerate(payload.operations):
                if isinstance(operation, UpdateMealOperation):
                    self._apply_meal_update(meal, operation)
                elif isinstance(operation, AddFoodItemOperation):
                    meal.items.append(
                        _new_food_item(
                            operation.item,
                            order=final_orders[("new", index)],
                        )
                    )
                elif isinstance(operation, UpdateFoodItemOperation):
                    self._apply_item_update(items[operation.item_id], operation)
                elif isinstance(operation, RemoveFoodItemOperation):
                    await self.session.delete(items[operation.item_id])

            meal.updated_at = func.now()
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValidationDomainError(
                "Meal could not be edited due to a data constraint violation"
            ) from exc
        except Exception:
            await self.session.rollback()
            raise

        self.session.expire_all()
        return _to_meal_read(await self._get_meal(meal_id))

    async def delete_meal(
        self,
        meal_id: UUID,
        payload: MealDeleteRequest,
    ) -> MealDeleteResult:
        try:
            meal = await self._get_meal(meal_id, for_update=True)
            self._require_current_version(meal, payload.expected_updated_at)
            expected_confirmation = f"DELETE {meal_id}"
            if payload.confirmation != expected_confirmation:
                raise ValidationDomainError(
                    f"confirmation must exactly match '{expected_confirmation}'"
                )
            await self.session.delete(meal)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise
        return MealDeleteResult(meal_id=meal_id)

    async def _get_meal(self, meal_id: UUID, *, for_update: bool = False) -> Meal:
        query = (
            select(Meal)
            .where(Meal.id == meal_id)
            .options(selectinload(Meal.items))
        )
        if for_update:
            query = query.with_for_update()
        meal = await self.session.scalar(query)
        if meal is None:
            raise NotFoundError(f"Meal {meal_id} was not found")
        return meal

    @staticmethod
    def _require_current_version(meal: Meal, expected_updated_at: datetime) -> None:
        if meal.updated_at != expected_updated_at:
            raise ConflictDomainError(
                "Meal has changed since it was read; retrieve it again before editing"
            )

    @staticmethod
    def _item_in_meal(items: dict[UUID, FoodItem], item_id: UUID) -> FoodItem:
        item = items.get(item_id)
        if item is None:
            raise ValidationDomainError(
                f"Food item {item_id} does not belong to this meal"
            )
        return item

    @classmethod
    def _validate_operation_conflicts(
        cls,
        payload: MealEditRequest,
        items: dict[UUID, FoodItem],
    ) -> None:
        meal_updates = sum(
            isinstance(operation, UpdateMealOperation)
            for operation in payload.operations
        )
        if meal_updates > 1:
            raise ValidationDomainError(
                "A meal edit may contain at most one update_meal operation"
            )

        touched: set[UUID] = set()
        for operation in payload.operations:
            if not isinstance(
                operation,
                UpdateFoodItemOperation | RemoveFoodItemOperation,
            ):
                continue
            cls._item_in_meal(items, operation.item_id)
            if operation.item_id in touched:
                raise ValidationDomainError(
                    "A food item may be updated or removed only once per edit"
                )
            touched.add(operation.item_id)

    @staticmethod
    def _apply_meal_update(meal: Meal, operation: UpdateMealOperation) -> None:
        for field_name in ("eaten_at", "name", "notes"):
            if field_name in operation.model_fields_set:
                value = getattr(operation, field_name)
                if field_name == "name" and value is not None:
                    value = value.strip()
                setattr(meal, field_name, value)

    @staticmethod
    def _apply_item_update(
        item: FoodItem,
        operation: UpdateFoodItemOperation,
    ) -> None:
        field_names = (
            "name",
            "quantity",
            "unit",
            "calories_kcal",
            "protein_g",
            "carbohydrates_g",
            "fat_g",
            "notes",
        )
        for field_name in field_names:
            if field_name in operation.model_fields_set:
                value = getattr(operation, field_name)
                if field_name == "name" and value is not None:
                    value = value.strip()
                setattr(item, field_name, value)
        if "order" in operation.model_fields_set:
            item.item_order = operation.order
