const Prediction = require("../models/Prediction");

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

module.exports = {
    getPredictions,
    getLatestPrediction,
    createPrediction
};