from fastapi import FastAPI

from aristoteles.api import router as analysis_router


def create_app() -> FastAPI:
    app = FastAPI(title="Aristoteles API", version="0.1.0")
    app.include_router(analysis_router)

    return app


app = create_app()
