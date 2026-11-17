
import pandas as pd

from src.api.model_loader import load_models


models, schema = load_models()

sample = {
    "latency_ms": 35.0,
    "packet_loss_percent": 1.0,
    "jitter_ms": 5.0,
    "download_mbps": 80.0,
    "upload_mbps": 30.0,
    "wifi_signal_percent": 85.0,
    "dns_response_ms": 25.0,
    "http_response_ms": 150.0,
    "target_reachable": 1,
}

X = pd.DataFrame(
    [[sample[name] for name in schema["features"]]],
    columns=schema["features"]
)

print("NETWORK STABILITY MODEL TEST")
print("=" * 40)

for name, model in models.items():
    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]

    print(f"\nModel: {name}")
    print(f"Prediction: {prediction}")

    for label, probability in zip(
        model.classes_, probabilities
    ):
        print(f"  {label}: {probability:.2%}")

print("\nAll model inference tests completed.")
