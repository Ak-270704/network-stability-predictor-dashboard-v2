
const mongoose = require("mongoose");

const Prediction = require("../models/Prediction");
const MLNetworkMetric = require("../models/MLNetworkMetric");

const getClassifiedPredictions = async (req, res) => {
    try {
        const { locationId } = req.query;

        if (!mongoose.isValidObjectId(locationId)) {
            return res.status(400).json({
                success: false,
                message: "Valid location ObjectId is required"
            });
        }

        const [predictions, linkedPredictionIds] = await Promise.all([
            Prediction.find({ location: locationId })
                .populate("location")
                .sort({ predictedAt: -1 })
                .lean(),

            MLNetworkMetric.distinct("predictionId", {
                location: locationId,
                predictionId: { $ne: null }
            })
        ]);

        const collectorIds = new Set(
            linkedPredictionIds.map((id) => String(id))
        );

        const collector = [];
        const independent = [];

        for (const prediction of predictions) {
            if (collectorIds.has(String(prediction._id))) {
                collector.push(prediction);
            } else {
                independent.push(prediction);
            }
        }

        return res.status(200).json({
            success: true,
            counts: {
                total: predictions.length,
                collector: collector.length,
                independent: independent.length
            },
            data: {
                collector,
                independent
            }
        });
    } catch (error) {
        console.error(
            "Prediction classification error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to classify predictions"
        });
    }
};

module.exports = {
    getClassifiedPredictions
};
