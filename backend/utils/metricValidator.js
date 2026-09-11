const normalizeMetric = (data) => {
    const normalized = {
        latency: Number(data.latency),
        packetLoss: Number(data.packetLoss),
        bandwidth: Number(data.bandwidth),
        jitter: Number(data.jitter),
        uptime: Number(data.uptime)
    };

    return normalized;
};


const validateMetric = (data) => {
    const fields = [
        "latency",
        "packetLoss",
        "bandwidth",
        "jitter",
        "uptime"
    ];

    for (const field of fields) {
        if (
            data[field] === undefined ||
            data[field] === null ||
            Number.isNaN(Number(data[field]))
        ) {
            return {
                valid: false,
                message: `${field} must be a valid number`
            };
        }
    }

    if (data.latency < 0) {
        return {
            valid: false,
            message: "Latency cannot be negative"
        };
    }

    if (data.packetLoss < 0 || data.packetLoss > 100) {
        return {
            valid: false,
            message: "Packet loss must be between 0 and 100"
        };
    }

    if (data.bandwidth < 0) {
        return {
            valid: false,
            message: "Bandwidth cannot be negative"
        };
    }

    if (data.jitter < 0) {
        return {
            valid: false,
            message: "Jitter cannot be negative"
        };
    }

    if (data.uptime < 0 || data.uptime > 100) {
        return {
            valid: false,
            message: "Uptime must be between 0 and 100"
        };
    }

    return {
        valid: true,
        message: "Metric is valid"
    };
};


const validateAndNormalizeMetric = (data) => {
    const normalizedData = normalizeMetric(data);

    const validation = validateMetric(normalizedData);

    return {
        ...validation,
        data: normalizedData
    };
};


module.exports = {
    normalizeMetric,
    validateMetric,
    validateAndNormalizeMetric
};