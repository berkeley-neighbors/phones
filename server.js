import express from "express";
import process from "process";
import { MongoClient } from "mongodb";
import { setRoutes } from "./set-routes.js";
import { getEnvironmentVariable } from "./get-environment-variable.js";
import cookieParser from "cookie-parser";
import { mongo } from "./middleware.js";
import path from "path";
import { fileURLToPath } from "url";

import { API_DEVELOPMENT_PORT } from "./config.js";
const app = express();

const PORT = getEnvironmentVariable("PORT", 3000);
const COOKIE_SECRET = getEnvironmentVariable("COOKIE_SECRET");
const MONGO_CONNECTION_STR = getEnvironmentVariable("MONGO_CONNECTION_STR", "mongodb://localhost:27017");
const MONGO_DATABASE = getEnvironmentVariable("MONGO_DATABASE", "dispatch");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function connectMongoDB() {
  try {
    const mongoClient = new MongoClient(MONGO_CONNECTION_STR);
    await mongoClient.connect();
    console.log("Connected to MongoDB");

    return mongoClient;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Start server with MongoDB initialization
async function startServer() {
  let applicationPort;
  const connectedClient = await connectMongoDB();

  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down gracefully");
    if (connectedClient) {
      await connectedClient.close();
    }
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("Received SIGINT, shutting down gracefully");
    if (connectedClient) {
      await connectedClient.close();
    }
    process.exit(0);
  });

  try {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cookieParser(COOKIE_SECRET));

    app.use(mongo(connectedClient, MONGO_DATABASE));

    const db = connectedClient.db(MONGO_DATABASE);

    if (process.env.NODE_ENV === "production") {
      const distPath = path.join(__dirname, "dist");
      app.use(express.static(distPath));
      console.log(`Serving static files from: ${distPath}`);
      setRoutes(app, "/api", db);
      applicationPort = PORT;
    } else {
      setRoutes(app, "/", db);
      applicationPort = API_DEVELOPMENT_PORT;
    }

    app.listen(applicationPort, "0.0.0.0", () => {
      console.debug(`API instance running on port ${applicationPort}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
