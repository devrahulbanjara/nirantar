from nirantar.schemas.targets import TargetPatch
from nirantar.services.targets import TargetService
from tests.helpers import TEST_USER_ID


async def test_targets_are_absent_then_partially_upserted_and_cleared(
    db_session,
) -> None:
    service = TargetService(db_session, TEST_USER_ID)
    assert (await service.get_targets()).targets is None

    created = await service.set_targets(
        TargetPatch(calorie_target_kcal="2200", protein_target_g="140")
    )
    assert created.targets is not None
    assert created.targets.calorie_target_kcal == 2200
    assert created.targets.protein_target_g == 140

    updated = await service.set_targets(TargetPatch(protein_target_g=None))
    assert updated.targets is not None
    assert updated.targets.calorie_target_kcal == 2200
    assert updated.targets.protein_target_g is None


async def test_targets_are_scoped_by_owner(db_session) -> None:
    await TargetService(db_session, TEST_USER_ID).set_targets(
        TargetPatch(goal_weight_kg="70")
    )
    assert (await TargetService(db_session, "user_other").get_targets()).targets is None
