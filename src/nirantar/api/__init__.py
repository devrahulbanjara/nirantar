from nirantar.api.meals import router as meals_router
from nirantar.api.summaries import router as summaries_router
from nirantar.api.workouts import router as workouts_router
from nirantar.api.weights import router as weights_router

__all__ = [
    "meals_router",
    "summaries_router",
    "weights_router",
    "workouts_router",
]
