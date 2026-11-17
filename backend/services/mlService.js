
const ML_API_URL = (
    process.env.ML_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const ML_TIMEOUT_MS = 10000;

const REQUIRED_FEATURES = [
    "latency_ms",
    "packet_loss_percent",
    "jitter_ms",
    "download_mbps",
    "upload_mbps",
    "wifi_signal_percent",
    "dns_response_ms",
    "http_response_ms",
    "target_reachable"
];

const callMLService = async (endpoint, metrics) => {
    const response = await fetch(
        `${ML_API_URL}${endpoint}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(metrics),
            signal: AbortSignal.timeout(ML_TIMEOUT_MS)
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            `ML service returned HTTP ${response.status}: ` +
            JSON.stringify(data)
        );
    }

    return data;
};

const validateMetrics = (metrics) => {
    if (
        !metrics ||
        typeof metrics !== "object" ||
        Array.isArray(metrics)
    ) {
        throw new Error("Network metrics must be an object");
    }

    const missing = REQUIRED_FEATURES.filter(
        (feature) => !(feature in metrics)
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing network metrics: ${missing.join(", ")}`
        );
    }

    return metrics;
};

const predictCurrent = async (metrics) => {
    return callMLService(
        "/predict/current",
        validateMetrics(metrics)
    );
};

const predictFuture = async (metrics) => {
    return callMLService(
        "/predict/future",
        validateMetrics(metrics)
    );
};

module.exports = {
    predictCurrent,
    predictFuture,
    validateMetrics
};
