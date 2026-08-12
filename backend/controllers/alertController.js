const Alert = require("../models/Alert");

// Get all alerts
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("location")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch alerts",
            error: error.message
        });
    }
};

// Create alert
const createAlert = async (req, res) => {
    try {
        const {
            location,
            type,
            severity,
            message,
            value,
            threshold
        } = req.body;

        const alert = await Alert.create({
            location,
            type,
            severity,
            message,
            value,
            threshold
        });

        const populatedAlert = await alert.populate("location");

        res.status(201).json({
            success: true,
            message: "Alert created successfully",
            data: populatedAlert
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create alert",
            error: error.message
        });
    }
};

// Resolve alert
const resolveAlert = async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            {
                resolved: true,
                resolvedAt: new Date()
            },
            {
                new: true
            }
        ).populate("location");

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Alert resolved successfully",
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to resolve alert",
            error: error.message
        });
    }
};

module.exports = {
    getAlerts,
    createAlert,
    resolveAlert
};