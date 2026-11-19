
const express = require("express");

const {
    getPredictions,
    getLatestPrediction,
    createPrediction,
    createCurrentMLPrediction,
    createFutureMLPrediction
} = require("../controllers/predictionController");

const {
    getClassifiedPredictions
} = require("../controllers/classifiedPredictionController");

const router = express.Router();

router.get("/", getPredictions);
router.get("/latest", getLatestPrediction);

// Read-only collector vs independent prediction classification
router.get("/classified", getClassifiedPredictions);

router.post("/", createPrediction);
router.post("/ml/current", createCurrentMLPrediction);
router.post("/ml/future", createFutureMLPrediction);

module.exports = router;
