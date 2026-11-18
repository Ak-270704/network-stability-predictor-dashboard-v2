
import os
import uuid
import math
import requests

BACKEND_URL = os.getenv(
    "NETWORK_BACKEND_URL",
    "http://127.0.0.1:5000/api/metrics/ml"
)

LOCATION_ID = os.getenv(
    "NETWORK_LOCATION_ID",
    "6a79ee55d8c026ecfb336321"
)

FEATURE_NAMES = [
    "latency_ms",
    "packet_loss_percent",
    "jitter_ms",
    "download_mbps",
    "upload_mbps",
    "wifi_signal_percent",
    "dns_response_ms",
    "http_response_ms",
    "target_reachable"
]


def validate_measurement(metrics):
    if not isinstance(metrics, dict):
        return False, "Metrics must be a dictionary"

    for feature in FEATURE_NAMES:
        value = metrics.get(feature)

        if isinstance(value, bool) or not isinstance(
            value, (int, float)
        ):
            return False, f"Invalid or missing: {feature}"

        if not math.isfinite(value) or value < 0:
            return False, f"Invalid value: {feature}"

    for feature in [
        "packet_loss_percent",
        "wifi_signal_percent"
    ]:
        if metrics[feature] > 100:
            return False, f"Out of range: {feature}"

    if metrics["target_reachable"] not in (0, 1):
        return False, "target_reachable must be 0 or 1"

    return True, None


def build_payload(metrics, measurement_id=None):
    valid, error = validate_measurement(metrics)

    if not valid:
        raise ValueError(error)

    return {
        "location": LOCATION_ID,
        "measurementId": (
            measurement_id or str(uuid.uuid4())
        ),
        "metrics": {
            feature: metrics[feature]
            for feature in FEATURE_NAMES
        }
    }


def send_to_backend(payload):
    """
    Send an existing payload without changing its ID.

    Reuse the same payload for retries to prevent
    duplicate MongoDB measurements.
    """
    try:
        response = requests.post(
            BACKEND_URL,
            json=payload,
            timeout=15
        )

        if response.status_code in (200, 201):
            data = response.json()

            if not data.get("success"):
                print("Backend rejected measurement")
                return False

            print(
                "Backend submission successful:",
                "HTTP", response.status_code
            )

            print(
                "Measurement ID:",
                payload["measurementId"]
            )

            print(
                "Prediction status:",
                data.get("data", {}).get(
                    "predictionStatus", "unknown"
                )
            )

            return True

        print(
            "Backend rejected measurement:",
            response.status_code,
            response.text[:300]
        )

        return False

    except requests.RequestException as error:
        print(
            "Backend unavailable; local CSV remains intact:",
            error
        )
        return False

    except ValueError as error:
        print("Invalid backend response:", error)
        return False
