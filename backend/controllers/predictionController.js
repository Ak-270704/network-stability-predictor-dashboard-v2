const Prediction = require("../models/Prediction");
const {emitPredictionUpdate} = require("../sockets/socket");

// Get all predictions
const getPredictions = async (req, res) => {
    try {
        const predictions = await Prediction.find()
            .populate("location")
            .sort({ predictedAt: -1 });

        res.status(200).json({
            success: true,
            count: predictions.length,
            data: predictions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch predictions",
            error: error.message
        });
    }
};

// Get latest prediction
const getLatestPrediction = async (req, res) => {
    try {
        const prediction = await Prediction.findOne()
            .populate("location")
            .sort({ predictedAt: -1 });

        if (!prediction) {
            return res.status(404).json({
                success: false,
                message: "No predictions found"
            });
        }

        res.status(200).json({
            success: true,
            data: prediction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch latest prediction",
            error: error.message
        });
    }
};

// Create prediction
const createPrediction = async (req, res) => {
    try {
        const {
            location,
            predictedStatus,
            predictedScore,
            confidence,
            predictionHorizon,
            modelVersion
        } = req.body;

        const prediction = await Prediction.create({
            location,
            predictedStatus,
            predictedScore,
            confidence,
            predictionHorizon,
            modelVersion
        });

        const populatedPrediction = await prediction.populate("location");

        res.status(201).json({
            success: true,
            message: "Prediction created successfully",
            data: populatedPrediction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create prediction",
            error: error.message
        });
    }
};

const mongoose = require("mongoose");

const {
    predictCurrent,
    predictFuture
} = require("../services/mlService");

// Convert ML labels into existing MongoDB status values
const mapStatus = (status) => {
    const statusMap = {
        Stable: "Stable",
        Warning: "Warning",
        Unstable: "Critical"
    };

    if (!Object.hasOwn(statusMap, status)) {
        throw new Error(`Unknown ML status: ${status}`);
    }

    return statusMap[status];
};

// Shared handler for current and future ML predictions
const createMLPrediction = async (req, res, type) => {
    try {
        const { location, metrics } = req.body;

        if (!mongoose.isValidObjectId(location)) {
            return res.status(400).json({
                success: false,
                message: "Valid location ObjectId is required"
            });
        }

        if (!metrics || typeof metrics !== "object" ||
            Array.isArray(metrics)) {
            return res.status(400).json({
                success: false,
                message: "Network metrics object is required"
            });
        }

        const mlResult = type === "future"
            ? await predictFuture(metrics)
            : await predictCurrent(metrics);

        const confidencePercent = Math.round(mlResult.confidence * 10000) / 100;

        const prediction = await Prediction.create({
            location,
            predictedStatus: mapStatus(mlResult.prediction),
            confidence: confidencePercent,
            predictionHorizon:
                type === "future" ? "5 minutes" : "current",
            modelVersion: mlResult.model
        });

        const populatedPrediction =
            await prediction.populate("location");
        emitPredictionUpdate(populatedPrediction);

        return res.status(201).json({
            success: true,
            message: `${type} ML prediction created`,
            data: populatedPrediction,
            mlResult
        });

    } catch (error) {
        console.error("ML prediction error:", error.message);

        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid prediction data"
            });
        }

        if (error.name === "TimeoutError" ||
            error.cause?.code === "ECONNREFUSED" ||
            error.cause?.code === "ECONNRESET") {
            return res.status(503).json({
                success: false,
                message: "ML prediction service unavailable"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to generate or save ML prediction"
        });
    }
};

const createCurrentMLPrediction = (req, res) =>
    createMLPrediction(req, res, "current");

const createFutureMLPrediction = (req, res) =>
    createMLPrediction(req, res, "future");


module.exports = {
    getPredictions,
    getLatestPrediction,
    createPrediction,
    createCurrentMLPrediction,
    createFutureMLPrediction
};