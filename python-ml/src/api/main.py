
from contextlib import asynccontextmanager
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict

from src.api.model_loader import load_models


# Load trained models once at application startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    models, schema = load_models()
    app.state.models = models
    app.state.schema = schema
    print("All three ML models loaded successfully.")
    yield


app = FastAPI(
    title="Network Stability Prediction API",
    description=(
        "ML inference service for current network stability "
        "and 5-minute-ahead forecasting"
    ),
    version="1.1.0",
    lifespan=lifespan
)


# Request schema - matches the nine trained features
class NetworkMetrics(BaseModel):
    model_config = ConfigDict(extra="forbid")

    latency_ms: float = Field(ge=0)
    packet_loss_percent: float = Field(ge=0, le=100)
    jitter_ms: float = Field(ge=0)
    download_mbps: float = Field(ge=0)
    upload_mbps: float = Field(ge=0)
    wifi_signal_percent: float = Field(ge=0, le=100)
    dns_response_ms: float = Field(ge=0)
    http_response_ms: float = Field(ge=0)
    target_reachable: Literal[0, 1]


def predict_with_model(metrics, model, features):
    values = metrics.model_dump()

    # Preserve the exact training feature order
    X = pd.DataFrame(
        [[values[name] for name in features]],
        columns=features
    )

    prediction = str(model.predict(X)[0])

    probabilities = model.predict_proba(X)[0]

    class_probabilities = {
        str(label): round(float(prob), 4)
        for label, prob in zip(
            model.classes_,
            probabilities
        )
    }

    return {
        "prediction": prediction,
        "confidence": class_probabilities[prediction],
        "probabilities": class_probabilities
    }


@app.get("/")
def root():
    return {
        "project": "Network Stability Predictor Dashboard",
        "service": "Python ML Inference API",
        "status": "running",
        "version": "1.1.0"
    }


@app.get("/health")
def health_check(request: Request):
    return {
        "status": "healthy",
        "models_loaded": list(request.app.state.models.keys()),
        "features": len(request.app.state.schema["features"])
    }


@app.post("/predict/current")
def predict_current(metrics: NetworkMetrics, request: Request):
    try:
        result = predict_with_model(
            metrics,
            request.app.state.models["random_forest"],
            request.app.state.schema["features"]
        )

        return {
            "model": "random_forest",
            "prediction_type": "current_stability",
            **result
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Current prediction failed"
        )


@app.post("/predict/future")
def predict_future(metrics: NetworkMetrics, request: Request):
    try:
        result = predict_with_model(
            metrics,
            request.app.state.models["future_random_forest"],
            request.app.state.schema["features"]
        )

        return {
            "model": "future_random_forest",
            "prediction_type": "future_stability",
            "forecast_horizon_minutes": 5,
            **result
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Future prediction failed"
        )
