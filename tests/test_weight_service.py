from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from nirantar.schemas.weights import (
    WeightCreate,
    WeightHistoryQuery,
    WeightUpdate,
)
from nirantar.services.errors import ConflictDomainError, ValidationDomainError
from nirantar.services.weights import WeightService
from tests.helpers import TEST_USER_ID


@pytest.mark.asyncio
async def test_log_weight_defaults_to_kathmandu_today(db_session) -> None:
    service = WeightService(
        db_session,
        TEST_USER_ID,
        user_timezone="Asia/Kathmandu",
        clock=lambda: datetime(2026, 8, 15, 19, 0, tzinfo=timezone.utc),
    )

    result = await service.log_weight(WeightCreate(weight_kg="72.35"))

    assert result.measured_on == date(2026, 8, 16)
    assert result.weight_kg == Decimal("72.350")


@pytest.mark.asyncio
async def test_duplicate_date_requires_edit(db_session) -> None:
    service = WeightService(db_session, TEST_USER_ID)
    payload = WeightCreate(weight_kg="72", measured_on=date(2026, 8, 16))
    await service.log_weight(payload)

    with pytest.raises(ValidationDomainError, match="use edit_weight instead"):
        await service.log_weight(payload)


@pytest.mark.asyncio
async def test_specific_day_and_history_are_deterministic(db_session) -> None:
    service = WeightService(db_session, TEST_USER_ID)
    await service.log_weight(
        WeightCreate(weight_kg="72.5", measured_on=date(2026, 8, 18))
    )
    await service.log_weight(
        WeightCreate(weight_kg="73", measured_on=date(2026, 8, 16))
    )

    missing = await service.get_weight(date(2026, 8, 17))
    history = await service.get_weight_history(
        WeightHistoryQuery(
            start_date=date(2026, 8, 16),
            end_date=date(2026, 8, 18),
        )
    )

    assert missing.entry is None
    assert [item.measured_on for item in history.entries] == [
        date(2026, 8, 16),
        date(2026, 8, 18),
    ]
    assert history.measurement_count == 2
    assert history.change_kg == Decimal("-0.500")


@pytest.mark.asyncio
async def test_edit_weight_supports_clearing_notes_and_rejects_stale_state(
    db_session,
) -> None:
    service = WeightService(db_session, TEST_USER_ID)
    created = await service.log_weight(
        WeightCreate(
            weight_kg="73",
            measured_on=date(2026, 8, 16),
            notes="morning",
        )
    )

    edited = await service.edit_weight(
        created.measured_on,
        WeightUpdate(
            expected_updated_at=created.updated_at,
            weight_kg="72.8",
            notes=None,
        ),
    )
    assert edited.weight_kg == Decimal("72.800")
    assert edited.notes is None
    assert edited.updated_at > created.updated_at

    with pytest.raises(ConflictDomainError):
        await service.edit_weight(
            created.measured_on,
            WeightUpdate(
                expected_updated_at=created.updated_at,
                notes="stale",
            ),
        )
