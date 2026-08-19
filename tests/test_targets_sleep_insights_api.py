async def test_targets_sleep_and_streak_http_contracts(api_client) -> None:
    absent = await api_client.get("/targets")
    assert absent.status_code == 200
    assert absent.json() == {"targets": None}

    targets = await api_client.patch(
        "/targets",
        json={"calorie_target_kcal": "2200", "target_workout_days_per_week": 4},
    )
    assert targets.status_code == 200
    assert targets.json()["targets"]["calorie_target_kcal"] == "2200.00"

    created = await api_client.post(
        "/sleep",
        json={
            "sleep_start": "2026-08-16T22:30:00+05:45",
            "sleep_end": "2026-08-17T06:00:00+05:45",
            "quality_rating": 4,
        },
    )
    assert created.status_code == 201
    entry = created.json()
    assert entry["sleep_date"] == "2026-08-17"
    assert entry["hours_slept"] == "7.500"

    history = await api_client.get(
        "/sleep", params={"start_date": "2026-08-17", "end_date": "2026-08-17"}
    )
    assert history.status_code == 200
    assert len(history.json()["entries"]) == 1

    invalid_history = await api_client.get(
        "/sleep", params={"start_date": "2026-08-18", "end_date": "2026-08-17"}
    )
    assert invalid_history.status_code == 422

    edited = await api_client.patch(
        f"/sleep/{entry['id']}",
        json={
            "expected_updated_at": entry["updated_at"],
            "operations": [{"operation": "update_sleep", "quality_rating": 5}],
        },
    )
    assert edited.status_code == 200
    assert edited.json()["quality_rating"] == 5

    streaks = await api_client.get("/insights/streaks")
    assert streaks.status_code == 200
    assert streaks.json()["sleep"]["current_streak_days"] >= 0
