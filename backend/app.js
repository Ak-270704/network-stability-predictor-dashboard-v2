const express = require("express");
const cors = require("cors");

const locationRoutes = require("./routes/locationRoutes");
const metricRoutes = require("./routes/metricRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const alertRoutes = require("./routes/alertRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Network Stability Predictor API is running"
    });
});

app.use("/api/locations", locationRoutes);
app.use("/api/metrics", metricRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/alerts", alertRoutes);

module.exports = app;