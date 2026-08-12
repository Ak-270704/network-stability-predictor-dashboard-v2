const os = require("os");
const { exec } = require("child_process");

const Metric = require("../models/Metric");

const getLatency = () => {
    return new Promise((resolve) => {
        const host = process.platform === "win32" ? "8.8.8.8" : "-c 1 8.8.8.8";

        const command =
            process.platform === "win32"
                ? `ping -n 1 ${host}`
                : `ping ${host}`;

        exec(command, (error, stdout) => {
            if (error) {
                return resolve(null);
            }

            const match = stdout.match(/time[=<]\s*(\d+(?:\.\d+)?)\s*ms/i);

            resolve(match ? Number(match[1]) : null);
        });
    });
};

const calculateStabilityScore = ({
    latency,
    packetLoss,
    jitter,
    uptime
}) => {
    const latencyScore = Math.max(0, 100 - latency);
    const packetLossScore = Math.max(0, 100 - packetLoss * 10);
    const jitterScore = Math.max(0, 100 - jitter * 5);

    const score =
        latencyScore * 0.35 +
        packetLossScore * 0.25 +
        jitterScore * 0.20 +
        uptime * 0.20;

    return Math.round(Math.min(100, Math.max(0, score)));
};

const getStabilityStatus = (score) => {
    if (score >= 75) {
        return "Stable";
    }

    if (score >= 50) {
        return "Warning";
    }

    return "Critical";
};

const collectNetworkMetric = async (locationId) => {
    try {
        const latency = await getLatency();

        const finalLatency = latency ?? 0;

        const packetLoss = latency === null ? 100 : 0;
        const bandwidth = 0;
        const jitter = 0;
        const uptime = latency === null ? 0 : 100;

        const stabilityScore = calculateStabilityScore({
            latency: finalLatency,
            packetLoss,
            jitter,
            uptime
        });

        const metric = await Metric.create({
            location: locationId,
            latency: finalLatency,
            packetLoss,
            bandwidth,
            jitter,
            uptime,
            stabilityScore
        });

        return metric;
    } catch (error) {
        console.error("Network metric collection failed:", error.message);
        throw error;
    }
};

module.exports = {
    collectNetworkMetric,
    calculateStabilityScore,
    getStabilityStatus
};