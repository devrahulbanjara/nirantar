from datetime import date, datetime

import pytest
from pydantic import ValidationError

from nirantar.schemas.weights import WeightCreate, WeightHistoryQuery, WeightUpdate


def test_weight_must_be_positive() -> None:
    with pytest.raises(ValidationError):
        WeightCreate(weight_kg=0)


def test_weight_history_range_must_be_forward() -> None:
    with pytest.raises(ValidationError):
        WeightHistoryQuery(
            start_date=date(2026, 8, 17),
            end_date=date(2026, 8, 16),
        )


def test_weight_edit_requires_aware_version_and_change() -> None:
    with pytest.raises(ValidationError):
        WeightUpdate(expected_updated_at=datetime(2026, 8, 16, 7, 0), notes="x")

    with pytest.raises(ValidationError):
        WeightUpdate(expected_updated_at=datetime.fromisoformat("2026-08-16T07:00+05:45"))
