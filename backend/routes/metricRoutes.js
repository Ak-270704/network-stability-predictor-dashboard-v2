const express = require("express");

const {
    getMetrics,
    getLatestMetric,
    getMetricsByLocation,
    createMetric,
    collectMetric
} = require("../controllers/metricController");

const router = express.Router();

router.get("/", getMetrics);
router.get("/latest", getLatestMetric);
router.get("/history/:locationId", getMetricsByLocation);
router.post("/", createMetric);
router.post("/collect", collectMetric);

module.exports = router;