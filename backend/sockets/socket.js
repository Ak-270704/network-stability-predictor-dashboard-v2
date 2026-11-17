let io;

const initializeSocket = (server) => {
    const { Server } = require("socket.io");

    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        socket.on("joinLocation", (locationId) => {
            socket.join(`location:${locationId}`);

            console.log(
                `📍 Client ${socket.id} joined location ${locationId}`
            );
        });

        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const emitMetricUpdate = (metric) => {
    if (!io) {
        console.warn("Socket.IO has not been initialized");
        return;
    }

    const locationId =
        metric.location?._id || metric.location;

    if (!locationId) {
        return;
    }

    io.to(`location:${locationId}`).emit(
        "metricUpdate",
        metric
    );

    io.emit("networkUpdate", metric);
};

const emitPredictionUpdate = (prediction) => {
    if (!io) {
        console.warn("Socket.IO has not been initialized");
        return;
    }

    const locationId =
        prediction.location?._id || prediction.location;

    if (!locationId) {
        console.warn("Prediction has no location");
        return;
    }

    // Send prediction to clients subscribed to this location
    io.to(`location:${locationId}`).emit(
        "predictionUpdate",
        prediction
    );

    // Send prediction to all connected dashboard clients
    io.emit("prediction:new", prediction);

    console.log(
        `Prediction broadcast for location ${locationId}`
    );
};


module.exports = {
    initializeSocket,
    emitMetricUpdate,
    emitPredictionUpdate
};