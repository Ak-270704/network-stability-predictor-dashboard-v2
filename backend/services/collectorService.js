const os = require("os");
const { exec } = require("child_process");
const { processMetric } = require("./metricProcessingService");

const getLatency = () => {
    return new Promise((resolve) => {
        const host = "8.8.8.8";

        const command =
            process.platform === "win32"
                ? `ping -n 1 ${host}`
                : `ping -c 1 ${host}`;

        exec(command, (error, stdout) => {
            if (error) {
                return resolve(null);
            }

            const match = stdout.match(
                /time[=<]\s*(\d+(?:\.\d+)?)\s*ms/i
            );

            resolve(match ? Number(match[1]) : null);
        });
    });
};

const collectNetworkMetric = async (locationId) => {
    try {
        const latency = await getLatency();

        const finalLatency = latency ?? 0;
        const packetLoss = latency === null ? 100 : 0;
        const bandwidth = 0;
        const jitter = 0;
        const uptime = latency === null ? 0 : 100;

        const result = await processMetric({
            location: locationId,
            latency: finalLatency,
            packetLoss,
            bandwidth,
            jitter,
            uptime
        });

        return result.metric;
    } catch (error) {
        console.error(
            "Network metric collection failed:",
            error.message
        );

        throw error;
    }
};

module.exports = {
    collectNetworkMetric
};