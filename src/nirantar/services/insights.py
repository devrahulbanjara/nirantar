from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, date, datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from nirantar.config import get_settings
from nirantar.models.meals import Meal
from nirantar.models.sleep import SleepEntry
from nirantar.models.targets import UserTarget
from nirantar.models.weights import BodyWeightEntry
from nirantar.models.workouts import WorkoutSession
from nirantar.schemas.insights import (
    DailyStreakRead,
    StreaksRead,
    TrendsRead,
    WorkoutConsistencyRead,
    WorkoutTargetProgressRead,
)


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _average(values: list[Decimal]) -> Decimal | None:
    if not values:
        return None
    return (sum(values, start=Decimal(0)) / len(values)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def _percentage(actual: Decimal, target: Decimal) -> Decimal | None:
    if target == 0:
        return None
    return ((actual / target) * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _streak(dates: set[date], today: date) -> DailyStreakRead:
    if not dates:
        return DailyStreakRead(current_streak_days=0, longest_streak_days=0)
    cursor = today if today in dates else today - timedelta(days=1)
    current = 0
    while cursor in dates:
        current += 1
        cursor -= timedelta(days=1)

    longest = run = 0
    previous: date | None = None
    for item in sorted(dates):
        run = (
            run + 1
            if previous is not None and item == previous + timedelta(days=1)
            else 1
        )
        longest = max(longest, run)
        previous = item
    return DailyStreakRead(
        current_streak_days=current,
        longest_streak_days=longest,
    )


class InsightService:
    """Compute timezone-correct trends and independent consistency measures."""

    def __init__(
        self,
        session: AsyncSession,
        owner_id: str,
        *,
        user_timezone: str | None = None,
        clock: Callable[[], datetime] = _utc_now,
    ) -> None:
        self.session = session
        self.owner_id = owner_id
        self.user_timezone = user_timezone or get_settings().user_timezone
        self.timezone = ZoneInfo(self.user_timezone)
        self.clock = clock

    def _bounds(self, start_date: date, end_date: date) -> tuple[datetime, datetime]:
        return (
            datetime.combine(start_date, time.min, tzinfo=self.timezone),
            datetime.combine(
                end_date + timedelta(days=1), time.min, tzinfo=self.timezone
            ),
        )

    async def get_trends(self, start_date: date, end_date: date) -> TrendsRead:
        start_at, end_at = self._bounds(start_date, end_date)
        meals = list(
            (
                await self.session.scalars(
                    select(Meal)
                    .where(
                        Meal.owner_id == self.owner_id,
                        Meal.eaten_at >= start_at,
                        Meal.eaten_at < end_at,
                    )
                    .options(selectinload(Meal.items))
                )
            ).all()
        )
        workouts = list(
            (
                await self.session.scalars(
                    select(WorkoutSession).where(
                        WorkoutSession.owner_id == self.owner_id,
                        WorkoutSession.check_in_at >= start_at,
                        WorkoutSession.check_in_at < end_at,
                    )
                )
            ).all()
        )
        weights = list(
            (
                await self.session.scalars(
                    select(BodyWeightEntry)
                    .where(
                        BodyWeightEntry.owner_id == self.owner_id,
                        BodyWeightEntry.measured_on >= start_date,
                        BodyWeightEntry.measured_on <= end_date,
                    )
                    .order_by(BodyWeightEntry.measured_on.asc())
                )
            ).all()
        )
        sleeps = list(
            (
                await self.session.scalars(
                    select(SleepEntry).where(
                        SleepEntry.owner_id == self.owner_id,
                        SleepEntry.sleep_date >= start_date,
                        SleepEntry.sleep_date <= end_date,
                    )
                )
            ).all()
        )
        target = await self.session.get(UserTarget, self.owner_id)

        calories_by_day: dict[date, list[Decimal]] = defaultdict(list)
        protein_by_day: dict[date, list[Decimal]] = defaultdict(list)
        meal_dates: set[date] = set()
        for meal in meals:
            local_date = meal.eaten_at.astimezone(self.timezone).date()
            meal_dates.add(local_date)
            calories_by_day[local_date].extend(
                item.calories_kcal
                for item in meal.items
                if item.calories_kcal is not None
            )
            protein_by_day[local_date].extend(
                item.protein_g for item in meal.items if item.protein_g is not None
            )

        daily_calories = [
            sum(values, start=Decimal(0))
            for values in calories_by_day.values()
            if values
        ]
        daily_protein = [
            sum(values, start=Decimal(0))
            for values in protein_by_day.values()
            if values
        ]
        average_calories = _average(daily_calories)
        workout_dates = {
            item.check_in_at.astimezone(self.timezone).date() for item in workouts
        }
        sleep_dates = {item.sleep_date for item in sleeps}
        weight_dates = {item.measured_on for item in weights}
        inclusive_days = Decimal((end_date - start_date).days + 1)

        workout_progress = None
        if target is not None and target.target_workout_days_per_week is not None:
            expected = (
                Decimal(target.target_workout_days_per_week)
                * inclusive_days
                / Decimal(7)
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            workout_progress = WorkoutTargetProgressRead(
                expected_workout_days=expected,
                percentage_of_target=_percentage(Decimal(len(workout_dates)), expected),
            )

        return TrendsRead(
            start_date=start_date,
            end_date=end_date,
            average_daily_calories_kcal=average_calories,
            average_daily_protein_g=_average(daily_protein),
            calorie_target_percentage=(
                _percentage(average_calories, target.calorie_target_kcal)
                if average_calories is not None
                and target is not None
                and target.calorie_target_kcal is not None
                else None
            ),
            weight_change_kg=(
                weights[-1].weight_kg - weights[0].weight_kg
                if len(weights) >= 2
                else None
            ),
            workout_days_logged=len(workout_dates),
            workout_target_progress=workout_progress,
            average_sleep_hours=_average([item.hours_slept for item in sleeps]),
            days_with_any_data=len(
                meal_dates | workout_dates | sleep_dates | weight_dates
            ),
        )

    async def get_streaks(self) -> StreaksRead:
        now = self.clock()
        if now.tzinfo is None:
            raise RuntimeError(
                "InsightService clock must return a timezone-aware datetime"
            )
        today = now.astimezone(self.timezone).date()
        meals = list(
            (
                await self.session.scalars(
                    select(Meal.eaten_at).where(Meal.owner_id == self.owner_id)
                )
            ).all()
        )
        workouts = list(
            (
                await self.session.scalars(
                    select(WorkoutSession.check_in_at).where(
                        WorkoutSession.owner_id == self.owner_id
                    )
                )
            ).all()
        )
        sleep_dates = set(
            (
                await self.session.scalars(
                    select(SleepEntry.sleep_date).where(
                        SleepEntry.owner_id == self.owner_id
                    )
                )
            ).all()
        )
        weight_dates = set(
            (
                await self.session.scalars(
                    select(BodyWeightEntry.measured_on).where(
                        BodyWeightEntry.owner_id == self.owner_id
                    )
                )
            ).all()
        )
        target = await self.session.get(UserTarget, self.owner_id)
        meal_dates = {item.astimezone(self.timezone).date() for item in meals}
        workout_dates = {item.astimezone(self.timezone).date() for item in workouts}
        week_start = today - timedelta(days=(today.weekday() + 1) % 7)
        return StreaksRead(
            as_of_date=today,
            meals=_streak(meal_dates, today),
            sleep=_streak(sleep_dates, today),
            weight=_streak(weight_dates, today),
            workouts=WorkoutConsistencyRead(
                days_since_last_workout=(
                    (today - max(workout_dates)).days if workout_dates else None
                ),
                workout_days_logged_this_week=sum(
                    week_start <= item <= today for item in workout_dates
                ),
                target_workout_days_per_week=(
                    target.target_workout_days_per_week if target is not None else None
                ),
            ),
        )
