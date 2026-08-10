const express = require("express");
const cors = require("cors");

const locationRoutes = require("./routes/locationRoutes");
const metricRoutes = require("./routes/metricRoutes");
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
module.exports = app;