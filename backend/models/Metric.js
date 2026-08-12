const mongoose = require("mongoose");

const metricSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    latency: {
      type: Number,
      required: true,
      min: 0,
    },

    packetLoss: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    bandwidth: {
      type: Number,
      required: true,
      min: 0,
    },

    jitter: {
      type: Number,
      required: true,
      min: 0,
    },

    uptime: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    stabilityScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
metricSchema.index({ location: 1, recordedAt: -1 });
module.exports = mongoose.model("Metric", metricSchema);