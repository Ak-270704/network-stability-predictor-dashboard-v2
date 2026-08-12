const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "High Latency",
        "Packet Loss",
        "Low Bandwidth",
        "High Jitter",
        "Low Stability",
        "Network Failure",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    message: {
      type: String,
      required: true,
    },

    value: {
      type: Number,
    },

    threshold: {
      type: Number,
    },

    resolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ location: 1, createdAt: -1 });

module.exports = mongoose.model("Alert", alertSchema);