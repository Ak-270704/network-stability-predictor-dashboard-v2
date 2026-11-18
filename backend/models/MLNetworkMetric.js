
const mongoose = require("mongoose");

const mlNetworkMetricSchema = new mongoose.Schema(
    {
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
            required: true,
            index: true
        },
measurementId: {
    type: String,
    required: true,
    unique: true,
    trim: true
},

        latency_ms: {
            type: Number,
            required: true,
            min: 0
        },

        packet_loss_percent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        jitter_ms: {
            type: Number,
            required: true,
            min: 0
        },

        download_mbps: {
            type: Number,
            required: true,
            min: 0
        },

        upload_mbps: {
            type: Number,
            required: true,
            min: 0
        },

        wifi_signal_percent: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        dns_response_ms: {
            type: Number,
            required: true,
            min: 0
        },

        http_response_ms: {
            type: Number,
            required: true,
            min: 0
        },

        target_reachable: {
            type: Number,
            required: true,
            enum: [0, 1]
        },

predictionStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending"
},

predictionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prediction",
    default: null
},

predictionError: {
    type: String,
    default: null
},

predictionAttempts: {
    type: Number,
    default: 0,
    min: 0
},
predictionProcessingToken: {
    type: String,
    default: null
},
lastPredictionAttemptAt: {
    type: Date,
    default: null
},

        recordedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

mlNetworkMetricSchema.index({
    location: 1,
    recordedAt: -1
});

module.exports = mongoose.model(
    "MLNetworkMetric",
    mlNetworkMetricSchema
);
