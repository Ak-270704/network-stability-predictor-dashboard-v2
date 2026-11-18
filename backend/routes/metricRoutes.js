const express = require("express");

const {
    getMetrics,
    getLatestMetric,
    getMetricsByLocation,
    createMetric,
    collectMetric
} = require("../controllers/metricController");

const {
    ingestMLMetric,
    retryMLMetricPrediction
} = require("../controllers/mlMetricController");

const router = express.Router();

router.get("/", getMetrics);
router.get("/latest", getLatestMetric);
router.get("/history/:locationId", getMetricsByLocation);
router.post("/", createMetric);
router.post("/collect", collectMetric);
router.post("/ml", ingestMLMetric);
router.post("/ml/:metricId/retry", retryMLMetricPrediction);

module.exports = router;