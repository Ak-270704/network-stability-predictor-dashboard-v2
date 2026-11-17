
import json
from pathlib import Path

import joblib


# python-ml directory
BASE_DIR = Path(__file__).resolve().parents[2]

MODELS_DIR = BASE_DIR / "models"

MODEL_FILES = {
    "decision_tree": "decision_tree.joblib",
    "random_forest": "random_forest.joblib",
    "future_random_forest": "future_random_forest.joblib",
}


def load_models():
    schema_path = MODELS_DIR / "model_schema.json"

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    features = schema["features"]
    models = {}

    for model_name, filename in MODEL_FILES.items():
        model_path = MODELS_DIR / filename

        model = joblib.load(model_path)

        if model.n_features_in_ != len(features):
            raise ValueError(
                f"Feature mismatch in {model_name}"
            )

        if hasattr(model, "feature_names_in_"):
            if list(model.feature_names_in_) != features:
                raise ValueError(
                    f"Feature order mismatch in {model_name}"
                )

        models[model_name] = model

    return models, schema
