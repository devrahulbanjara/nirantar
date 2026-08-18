from nirantar.api.insights import router as insights_router
from nirantar.api.meals import router as meals_router
from nirantar.api.sleep import router as sleep_router
from nirantar.api.summaries import router as summaries_router
from nirantar.api.targets import router as targets_router
from nirantar.api.weights import router as weights_router
from nirantar.api.workouts import router as workouts_router

__all__ = [
    "insights_router",
    "meals_router",
    "sleep_router",
    "summaries_router",
    "targets_router",
    "weights_router",
    "workouts_router",
]
