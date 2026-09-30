import mongoose from "mongoose";
import logger, { errorMeta } from "../utils/logger.js";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 10_000,
            socketTimeoutMS: 45_000,
        });

        logger.info("MongoDB connected");

        mongoose.connection.on("disconnected", () =>
            logger.warn("MongoDB disconnected")
        );
        mongoose.connection.on("reconnected", () =>
            logger.info("MongoDB reconnected")
        );
    } catch (error) {
        // errorMeta never includes the connection string
        logger.error("MongoDB connection failed", errorMeta(error));
        process.exit(1);
    }
};

export default connectDB;
