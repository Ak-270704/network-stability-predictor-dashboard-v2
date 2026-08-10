const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    predictedStatus: {
      type: String,
      enum: ["Stable", "Warning", "Critical"],
      required: true,
    },

    predictedScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },

    predictionHorizon: {
      type: String,
      default: "1 hour",
    },

    predictedAt: {
      type: Date,
      default: Date.now,
    },

    modelVersion: {
      type: String,
      default: "v1.0",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Prediction", predictionSchema);