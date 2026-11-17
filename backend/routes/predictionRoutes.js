
const express = require("express");

const {
    getPredictions,
    getLatestPrediction,
    createPrediction,
    createCurrentMLPrediction,
    createFutureMLPrediction
} = require("../controllers/predictionController");

const router = express.Router();

// Existing CRUD routes
router.get("/", getPredictions);
router.get("/latest", getLatestPrediction);
router.post("/", createPrediction);

// New ML prediction routes
router.post("/ml/current", createCurrentMLPrediction);
router.post("/ml/future", createFutureMLPrediction);

module.exports = router;
