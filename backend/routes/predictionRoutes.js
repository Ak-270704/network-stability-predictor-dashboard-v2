const express = require("express");

const {
    getPredictions,
    getLatestPrediction,
    createPrediction
} = require("../controllers/predictionController");

const router = express.Router();

router.get("/", getPredictions);
router.get("/latest", getLatestPrediction);
router.post("/", createPrediction);

module.exports = router;