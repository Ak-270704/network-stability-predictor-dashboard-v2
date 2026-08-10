const Metric = require("../models/Metric");

// Get all metrics
const getMetrics = async (req, res) => {
    try {
        const metrics = await Metric.find()
            .populate("location")
            .sort({ recordedAt: -1 });

        res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch network metrics",
            error: error.message
        });
    }
};

// Get latest metric
const getLatestMetric = async (req, res) => {
    try {
        const metric = await Metric.findOne()
            .populate("location")
            .sort({ recordedAt: -1 });

        if (!metric) {
            return res.status(404).json({
                success: false,
                message: "No network metrics found"
            });
        }

        res.status(200).json({
            success: true,
            data: metric
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch latest metric",
            error: error.message
        });
    }
};

// Get metrics for a specific location
const getMetricsByLocation = async (req, res) => {
    try {
        const metrics = await Metric.find({
            location: req.params.locationId
        })
            .populate("location")
            .sort({ recordedAt: -1 });

        res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch location metrics",
            error: error.message
        });
    }
};

// Create network metric
const createMetric = async (req, res) => {
    try {
        const {
            location,
            latency,
            packetLoss,
            bandwidth,
            jitter,
            uptime,
            stabilityScore
        } = req.body;

        const metric = await Metric.create({
            location,
            latency,
            packetLoss,
            bandwidth,
            jitter,
            uptime,
            stabilityScore
        });

        const populatedMetric = await metric.populate("location");

        res.status(201).json({
            success: true,
            message: "Network metric created successfully",
            data: populatedMetric
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create network metric",
            error: error.message
        });
    }
};

module.exports = {
    getMetrics,
    getLatestMetric,
    getMetricsByLocation,
    createMetric
};