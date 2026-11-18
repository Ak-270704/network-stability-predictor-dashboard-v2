
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

const validateAndNormalizeMLMetrics = (input) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return {
            valid: false,
            message: "Metrics must be a JSON object"
        };
    }

    const normalized = {};

    for (const feature of REQUIRED_FEATURES) {
        const value = input[feature];

        if (
            value === undefined ||
            value === null ||
            value === "" ||
            typeof value !== "number" ||
            !Number.isFinite(value)
        ) {
            return {
                valid: false,
                message: `${feature} must be a finite number`
            };
        }

        normalized[feature] = value;
    }

    const nonNegativeFeatures = [
        "latency_ms",
        "jitter_ms",
        "download_mbps",
        "upload_mbps",
        "dns_response_ms",
        "http_response_ms"
    ];

    for (const feature of nonNegativeFeatures) {
        if (normalized[feature] < 0) {
            return {
                valid: false,
                message: `${feature} cannot be negative`
            };
        }
    }

    for (const feature of [
        "packet_loss_percent",
        "wifi_signal_percent"
    ]) {
        if (normalized[feature] < 0 || normalized[feature] > 100) {
            return {
                valid: false,
                message: `${feature} must be between 0 and 100`
            };
        }
    }

    if (![0, 1].includes(normalized.target_reachable)) {
        return {
            valid: false,
            message: "target_reachable must be 0 or 1"
        };
    }

    return {
        valid: true,
        data: normalized
    };
};

module.exports = {
    REQUIRED_FEATURES,
    validateAndNormalizeMLMetrics
};
