const Metric = require("../models/Metric");
const { emitMetricUpdate } = require("../sockets/socket");

const validateMetric = (data) => {
    const requiredFields = [
        "latency",
        "packetLoss",
        "bandwidth",
        "jitter",
        "uptime"
    ];

    for (const field of requiredFields) {
        if (
            data[field] === undefined ||
            data[field] === null ||
            Number.isNaN(Number(data[field]))
        ) {
            return {
                valid: false,
                message: `${field} is required and must be numeric`
            };
        }
    }

    if (data.latency < 0) {
        return { valid: false, message: "Latency cannot be negative" };
    }

    if (data.packetLoss < 0 || data.packetLoss > 100) {
        return { valid: false, message: "Packet loss must be between 0 and 100" };
    }

    if (data.bandwidth < 0) {
        return { valid: false, message: "Bandwidth cannot be negative" };
    }

    if (data.jitter < 0) {
        return { valid: false, message: "Jitter cannot be negative" };
    }

    if (data.uptime < 0 || data.uptime > 100) {
        return { valid: false, message: "Uptime must be between 0 and 100" };
    }

    return { valid: true };
};


const calculateStabilityScore = ({
    latency,
    packetLoss,
    bandwidth,
    jitter,
    uptime
}) => {

    const latencyScore = Math.max(0, 100 - latency);

    const packetLossScore =
        Math.max(0, 100 - packetLoss * 10);

    const jitterScore =
        Math.max(0, 100 - jitter * 5);

    const bandwidthScore =
        Math.min(100, bandwidth);

    const score =
        latencyScore * 0.30 +
        packetLossScore * 0.25 +
        bandwidthScore * 0.15 +
        jitterScore * 0.15 +
        uptime * 0.15;

    return Math.round(
        Math.min(100, Math.max(0, score))
    );
};


const getNetworkStatus = (score) => {

    if (score >= 75) {
        return "Stable";
    }

    if (score >= 50) {
        return "Warning";
    }

    return "Critical";
};


const processMetric = async (metricData) => {

    const validation = validateMetric(metricData);

    if (!validation.valid) {
        throw new Error(validation.message);
    }

    const stabilityScore = calculateStabilityScore(metricData);

    const metric = await Metric.create({
        ...metricData,
        stabilityScore
    });
    emitMetricUpdate(metric);
    return {
        metric,
        status: getNetworkStatus(stabilityScore)
    };
};


module.exports = {
    validateMetric,
    calculateStabilityScore,
    getNetworkStatus,
    processMetric
};