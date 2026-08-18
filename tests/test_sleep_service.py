from datetime import UTC, date, datetime

import pytest

from nirantar.schemas.sleep import SleepCreate, SleepEditRequest, SleepHistoryQuery
from nirantar.services.errors import ConflictDomainError, ValidationDomainError
from nirantar.services.sleep import SleepService
from tests.helpers import NEPAL, TEST_USER_ID


async def test_sleep_derives_wake_date_and_hours_in_nepal(db_session) -> None:
    service = SleepService(db_session, TEST_USER_ID)
    entry = await service.log_sleep(
        SleepCreate(
            sleep_start=datetime(2026, 8, 16, 13, 0, tzinfo=UTC),
            sleep_end=datetime(2026, 8, 16, 20, 15, tzinfo=UTC),
            quality_rating=4,
        )
    )
    assert entry.sleep_date == date(2026, 8, 17)
    assert entry.hours_slept == pytest.approx(7.25)

    found = await service.get_sleep(date(2026, 8, 17))
    assert found.entry is not None
    assert found.entry.id == entry.id

    other = await SleepService(db_session, "user_other").log_sleep(
        SleepCreate(
            sleep_start=datetime(2026, 8, 16, 14, 0, tzinfo=UTC),
            sleep_end=datetime(2026, 8, 16, 21, 0, tzinfo=UTC),
        )
    )
    assert other.sleep_date == entry.sleep_date
    assert (await service.get_sleep(date(2026, 8, 17))).entry.id == entry.id


async def test_sleep_rejects_duplicate_date_and_supports_stale_safe_edit(
    db_session,
) -> None:
    service = SleepService(db_session, TEST_USER_ID)
    entry = await service.log_sleep(
        SleepCreate(
            sleep_start=datetime(2026, 8, 16, 22, 30, tzinfo=NEPAL),
            sleep_end=datetime(2026, 8, 17, 6, 0, tzinfo=NEPAL),
        )
    )
    with pytest.raises(ValidationDomainError, match="already logged"):
        await service.log_sleep(
            SleepCreate(
                sleep_start=datetime(2026, 8, 16, 23, 0, tzinfo=NEPAL),
                sleep_end=datetime(2026, 8, 17, 7, 0, tzinfo=NEPAL),
            )
        )

    edited = await service.edit_sleep(
        entry.id,
        SleepEditRequest.model_validate(
            {
                "expected_updated_at": entry.updated_at,
                "operations": [
                    {
                        "operation": "update_sleep",
                        "quality_rating": 5,
                        "notes": "Rested",
                    }
                ],
            }
        ),
    )
    assert edited.quality_rating == 5
    assert edited.notes == "Rested"
    with pytest.raises(ConflictDomainError):
        await service.edit_sleep(
            entry.id,
            SleepEditRequest.model_validate(
                {
                    "expected_updated_at": entry.updated_at,
                    "operations": [{"operation": "update_sleep", "notes": "stale"}],
                }
            ),
        )


async def test_sleep_history_is_inclusive_and_ordered(db_session) -> None:
    service = SleepService(db_session, TEST_USER_ID)
    for day in (17, 18):
        await service.log_sleep(
            SleepCreate(
                sleep_start=datetime(2026, 8, day - 1, 22, tzinfo=NEPAL),
                sleep_end=datetime(2026, 8, day, 6, tzinfo=NEPAL),
            )
        )
    history = await service.get_sleep_history(
        SleepHistoryQuery(start_date=date(2026, 8, 17), end_date=date(2026, 8, 18))
    )
    assert [item.sleep_date for item in history.entries] == [
        date(2026, 8, 18),
        date(2026, 8, 17),
    ]
