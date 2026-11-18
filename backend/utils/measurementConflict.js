
const FEATURE_NAMES = [
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

const isSameMeasurement = (
    existingMetric,
    location,
    normalizedMetrics
) => {
    if (!existingMetric || !normalizedMetrics) {
        return false;
    }

    const existingLocation =
        existingMetric.location?._id ??
        existingMetric.location;

    if (String(existingLocation) !== String(location)) {
        return false;
    }

    return FEATURE_NAMES.every((feature) => {
        return (
            Number(existingMetric[feature]) ===
            Number(normalizedMetrics[feature])
        );
    });
};

module.exports = {
    isSameMeasurement
};
