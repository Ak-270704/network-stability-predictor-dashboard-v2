
require("dotenv").config();

const mongoose = require("mongoose");
const MLNetworkMetric = require("../models/MLNetworkMetric");

const runMigration = async () => {
    try {
        const mongoURI =
            process.env.MONGO_URI ||
            process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error(
                "MongoDB connection URI not found in .env"
            );
        }

        await mongoose.connect(mongoURI);

        console.log("MongoDB connected");

        const collection = MLNetworkMetric.collection;

        const filter = {
            $or: [
                { measurementId: { $exists: false } },
                { measurementId: null },
                { measurementId: "" }
            ]
        };

        const records = await collection
            .find(filter, { projection: { _id: 1 } })
            .toArray();

        console.log(
            `Records requiring migration: ${records.length}`
        );

        let migrated = 0;

        for (const record of records) {
            const measurementId =
                `legacy-${record._id.toString()}`;

            const result = await collection.updateOne(
                {
                    _id: record._id,
                    $or: filter.$or
                },
                {
                    $set: { measurementId }
                }
            );

            migrated += result.modifiedCount;
        }

        console.log(`Records migrated: ${migrated}`);

        const remaining = await collection.countDocuments(filter);

        if (remaining > 0) {
            throw new Error(
                `${remaining} records still lack measurementId`
            );
        }

        console.log("Migration completed successfully");

        // Create the unique index after existing data is migrated.
        await collection.createIndex(
            { measurementId: 1 },
            {
                unique: true,
                name: "measurementId_1"
            }
        );

        console.log("Unique measurementId index verified");

    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

runMigration();
