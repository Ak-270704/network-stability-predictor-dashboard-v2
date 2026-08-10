const Location = require("../models/Location");

// Get all locations
const getLocations = async (req, res) => {
    try {
        const locations = await Location.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: locations.length,
            data: locations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch locations",
            error: error.message
        });
    }
};

// Get single location
const getLocationById = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        res.status(200).json({
            success: true,
            data: location
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch location",
            error: error.message
        });
    }
};

// Create location
const createLocation = async (req, res) => {
    try {
        const {
            name,
            city,
            latitude,
            longitude,
            status,
            description
        } = req.body;

        const location = await Location.create({
            name,
            city,
            latitude,
            longitude,
            status,
            description
        });

        res.status(201).json({
            success: true,
            message: "Location created successfully",
            data: location
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create location",
            error: error.message
        });
    }
};

// Update location
const updateLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            data: location
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update location",
            error: error.message
        });
    }
};

// Delete location
const deleteLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndDelete(req.params.id);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Location deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete location",
            error: error.message
        });
    }
};

module.exports = {
    getLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation
};