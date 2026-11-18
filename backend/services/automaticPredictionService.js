
const Prediction = require("../models/Prediction");
const { predictCurrent } = require("./mlService");
const {
    validateAndNormalizeMLMetrics
} = require("../utils/mlMetricValidator");
const {
    emitPredictionUpdate
} = require("../sockets/socket");

const STATUS_MAP = {
    Stable: "Stable",
    Warning: "Warning",
    Unstable: "Critical"
};

const generateAutomaticPrediction = async (location, metrics) => {
    const validation = validateAndNormalizeMLMetrics(metrics);

    if (!validation.valid) {
        const error = new Error(validation.message);
        error.statusCode = 400;
        throw error;
    }

    const mlResult = await predictCurrent(validation.data);

    const predictedStatus = STATUS_MAP[mlResult.prediction];

    if (!predictedStatus) {
        throw new Error(
            `Unknown ML prediction: ${mlResult.prediction}`
        );
    }

    const confidence = Number(mlResult.confidence);

    if (
        !Number.isFinite(confidence) ||
        confidence < 0 ||
        confidence > 1
    ) {
        throw new Error("Invalid ML confidence value");
    }

    const prediction = await Prediction.create({
        location,
        predictedStatus,
        confidence: Math.round(confidence * 10000) / 100,
        predictionHorizon: "current",
        modelVersion: mlResult.model
    });

    const populatedPrediction =
        await prediction.populate("location");

    emitPredictionUpdate(populatedPrediction);

    return {
        prediction: populatedPrediction,
        mlResult
    };
};

module.exports = {
    generateAutomaticPrediction
};
