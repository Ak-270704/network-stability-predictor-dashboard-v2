
const { randomUUID } = require("crypto");
const mongoose = require("mongoose");

const MLNetworkMetric = require("../models/MLNetworkMetric");
const Prediction = require("../models/Prediction");

const { predictCurrent } = require("./mlService");
const {
    emitPredictionUpdate
} = require("../sockets/socket");

const STATUS_MAP = {
    Stable: "Stable",
    Warning: "Warning",
    Unstable: "Critical"
};

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

const LEASE_MS = 60000;
const MAX_ATTEMPTS = 3;

// Use the metric ID as a deterministic prediction ID.
// The documents belong to separate MongoDB collections.
const getPredictionId = (metricId) => {
    return new mongoose.Types.ObjectId(
        metricId.toString()
    );
};

const processMetricPrediction = async (metricId) => {
    const processingToken = randomUUID();
    const now = new Date();

    const leaseExpiry = new Date(
        now.getTime() - LEASE_MS
    );

    // Atomically claim an eligible metric.
    const metric = await MLNetworkMetric.findOneAndUpdate(
        {
            _id: metricId,
            $or: [
                { predictionStatus: "pending" },
                { predictionStatus: "failed" },
                {
                    predictionStatus: "processing",
                    lastPredictionAttemptAt: {
                        $lt: leaseExpiry
                    }
                }
            ],
            predictionAttempts: { $lt: MAX_ATTEMPTS }
        },
        {
            $set: {
                predictionStatus: "processing",
                predictionError: null,
                predictionProcessingToken: processingToken,
                lastPredictionAttemptAt: now
            },
            $inc: {
                predictionAttempts: 1
            }
        },
        {
            new: true
        }
    );

    if (!metric) {
        return {
            processed: false,
            message: "Metric already processed or unavailable"
        };
    }

    const predictionId = getPredictionId(metric._id);

    try {
        // Recover a prediction saved by a previous attempt.
        let prediction = await Prediction.findById(
            predictionId
        );

        if (!prediction) {
            const metrics = {};

            for (const feature of FEATURE_NAMES) {
                metrics[feature] = metric[feature];
            }

            const result = await predictCurrent(metrics);

            const predictedStatus =
                STATUS_MAP[result.prediction];

            if (!predictedStatus) {
                throw new Error(
                    `Unknown ML status: ${result.prediction}`
                );
            }

            const confidence = Number(result.confidence);

            if (
                !Number.isFinite(confidence) ||
                confidence < 0 ||
                confidence > 1
            ) {
                throw new Error(
                    "Invalid prediction confidence"
                );
            }

            // Insert only if this prediction does not exist.
            prediction = await Prediction.findOneAndUpdate(
                {
                    _id: predictionId
                },
                {
                    $setOnInsert: {
                        _id: predictionId,
                        location: metric.location,
                        predictedStatus,
                        confidence:
                            Math.round(confidence * 10000) / 100,
                        predictionHorizon: "current",
                        modelVersion: result.model
                    }
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );
        }

        // Only the current processing owner can complete.
        const completion = await MLNetworkMetric.updateOne(
            {
                _id: metric._id,
                predictionStatus: "processing",
                predictionProcessingToken: processingToken
            },
            {
                $set: {
                    predictionStatus: "completed",
                    predictionId: prediction._id,
                    predictionError: null,
                    predictionProcessingToken: null
                }
            }
        );

        if (completion.modifiedCount !== 1) {
            return {
                processed: false,
                message: "Processing lease was superseded"
            };
        }

        const populatedPrediction =
            await prediction.populate("location");

        emitPredictionUpdate(populatedPrediction);

        return {
            processed: true,
            prediction: populatedPrediction
        };

    } catch (error) {
        // Prevent an outdated attempt from overwriting
        // the state of a newer processing attempt.
        await MLNetworkMetric.updateOne(
            {
                _id: metric._id,
                predictionStatus: "processing",
                predictionProcessingToken: processingToken
            },
            {
                $set: {
                    predictionStatus: "failed",
                    predictionError: error.message,
                    predictionProcessingToken: null
                }
            }
        );

        throw error;
    }
};

module.exports = {
    processMetricPrediction
};
