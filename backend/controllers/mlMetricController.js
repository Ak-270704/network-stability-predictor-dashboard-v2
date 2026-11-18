
const mongoose = require("mongoose");
const Location = require("../models/Location");
const MLNetworkMetric = require("../models/MLNetworkMetric");

const {
    validateAndNormalizeMLMetrics
} = require("../utils/mlMetricValidator");

const {
    processMetricPrediction
} = require("../services/predictionRecoveryService");

const {
    emitMetricUpdate
} = require("../sockets/socket");

const {
    isSameMeasurement
} = require("../utils/measurementConflict");

const ingestMLMetric = async (req, res) => {
    try {
        const { location, metrics, measurementId } = req.body;

        if (!mongoose.isValidObjectId(location)) {
            return res.status(400).json({
                success: false,
                message: "Valid location ObjectId is required"
            });
        }

        if (
            typeof measurementId !== "string" ||
            !measurementId.trim() ||
            measurementId.trim().length > 128
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid measurementId is required"
            });
        }

        const cleanId = measurementId.trim();

        const validation = validateAndNormalizeMLMetrics(metrics);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const existing = await MLNetworkMetric.findOne({
            measurementId: cleanId
        });


if (existing) {
    if (!isSameMeasurement(existing, location, validation.data)) {
        return res.status(409).json({
            success: false,
            duplicate: false,
            message:
                "Measurement ID already exists with different data"
        });
    }

    return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Measurement already exists",
        data: {
            metric: existing,
            prediction: null,
            predictionStatus:
                existing.predictionStatus || "unknown"
        }
    });
}

        const locationExists = await Location.exists({
            _id: location
        });

        if (!locationExists) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        let savedMetric;

        try {
            savedMetric = await MLNetworkMetric.create({
                location,
                measurementId: cleanId,
                ...validation.data,
                predictionStatus: "pending"
            });
        } catch (error) {

if (error.code === 11000) {
    const duplicate = await MLNetworkMetric.findOne({
        measurementId: cleanId
    });

    if (!duplicate) {
        throw error;
    }

    if (!isSameMeasurement(duplicate, location, validation.data)) {
        return res.status(409).json({
            success: false,
            duplicate: false,
            message:
                "Measurement ID already exists with different data"
        });
    }

    return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Duplicate measurement prevented",
        data: {
            metric: duplicate,
            prediction: null,
            predictionStatus:
                duplicate.predictionStatus || "unknown"
        }
    });
}
            throw error;
        }

        const populatedMetric =
            await savedMetric.populate("location");

        emitMetricUpdate(populatedMetric);

        let predictionResult = null;
        let predictionError = null;

        try {
            predictionResult = await processMetricPrediction(
                savedMetric._id
            );
        } catch (error) {
            predictionError = error.message;

            console.error(
                "Automatic prediction failed:",
                predictionError
            );
        }

        const updatedMetric = await MLNetworkMetric.findById(
            savedMetric._id
        ).populate("location");

        return res.status(201).json({
            success: true,
            duplicate: false,
            message: predictionResult?.processed
                ? "Metric and prediction saved successfully"
                : "Metric saved; prediction pending or failed",
            data: {
                metric: updatedMetric,
                prediction:
                    predictionResult?.prediction || null,
                predictionStatus:
                    updatedMetric.predictionStatus
            },
            predictionError
        });

    } catch (error) {
        console.error(
            "ML ingestion error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to ingest ML metric"
        });
    }
};


const retryMLMetricPrediction = async (req, res) => {
    try {
        const { metricId } = req.params;

        if (!mongoose.isValidObjectId(metricId)) {
            return res.status(400).json({
                success: false,
                message: "Valid metric ObjectId is required"
            });
        }

        const metric = await MLNetworkMetric.findById(metricId);

        if (!metric) {
            return res.status(404).json({
                success: false,
                message: "Metric not found"
            });
        }

        if (metric.predictionStatus === "completed") {
            return res.status(409).json({
                success: false,
                message: "Prediction already completed"
            });
        }

        if (metric.predictionStatus !== "failed") {
            return res.status(409).json({
                success: false,
                message: "Only failed predictions can be retried"
            });
        }

        if (metric.predictionAttempts >= 3) {
            return res.status(409).json({
                success: false,
                message: "Maximum prediction attempts reached"
            });
        }

        const result = await processMetricPrediction(metricId);

        if (!result.processed) {
            return res.status(409).json({
                success: false,
                message: result.message
            });
        }

        const updatedMetric = await MLNetworkMetric.findById(
            metricId
        );

        return res.status(200).json({
            success: true,
            message: "Prediction recovered successfully",
            data: {
                metric: updatedMetric,
                prediction: result.prediction
            }
        });

    } catch (error) {
        console.error(
            "Prediction retry failed:",
            error.message
        );

        return res.status(502).json({
            success: false,
            message: "Prediction retry failed",
            error: error.message
        });
    }
};

// Get latest ML collector measurement
const getLatestMLMetric = async (req, res) => {
    try {
        const metric = await MLNetworkMetric.findOne()
            .populate("location")
            .sort({ recordedAt: -1 });

        if (!metric) {
            return res.status(404).json({
                success: false,
                message: "No ML network metrics found"
            });
        }

        return res.status(200).json({
            success: true,
            data: metric
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch latest ML metric"
        });
    }
};

// Get ML collector measurement history by location
const getMLMetricHistory = async (req, res) => {
    try {
        const { locationId } = req.params;

        if (!mongoose.isValidObjectId(locationId)) {
            return res.status(400).json({
                success: false,
                message: "Valid location ObjectId is required"
            });
        }

        const metrics = await MLNetworkMetric.find({
            location: locationId
        })
            .populate("location")
            .sort({ recordedAt: -1 })
            .limit(100);

        return res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ML metric history"
        });
    }
};

module.exports = {
    ingestMLMetric,
    retryMLMetricPrediction,
    getLatestMLMetric,
    getMLMetricHistory
};