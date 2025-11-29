import express from "express";
import process from "process";
import { MongoClient } from "mongodb";
import { setRoutes } from "./set-routes.js";
import { getEnvironmentVariable } from "./get-environment-variable.js";
import cookieParser from "cookie-parser";
import { mongo } from "./middleware.js";
const app = express();

const PORT = 4000;

const COOKIE_SECRET = getEnvironmentVariable("COOKIE_SECRET");
const MONGO_CONNECTION_STR = getEnvironmentVariable("MONGO_CONNECTION_STR", "mongodb://localhost:27017");
const MONGO_DATABASE = getEnvironmentVariable("MONGO_DATABASE", "dispatch");
const TWILIO_ALLOWED_PHONE_NUMBER_INBOUND = getEnvironmentVariable("TWILIO_ALLOWED_PHONE_NUMBER_INBOUND");
const TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND = getEnvironmentVariable("TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND");
const TWILIO_ACCOUNT_SID = getEnvironmentVariable("TWILIO_ACCOUNT_SID");
const TWILIO_API_TOKEN = getEnvironmentVariable("TWILIO_API_TOKEN");
const TWILIO_API_SECRET = getEnvironmentVariable("TWILIO_API_SECRET");
const SYNOLOGY_SSO_URL = getEnvironmentVariable("SYNOLOGY_SSO_URL");
const SYNOLOGY_SSO_APP_ID = getEnvironmentVariable("SYNOLOGY_SSO_APP_ID");
const SYNOLOGY_ALLOWED_GROUP = getEnvironmentVariable("SYNOLOGY_ALLOWED_GROUP", "");

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

    const twilioOptions = {
      accountSID: TWILIO_ACCOUNT_SID,
      token: TWILIO_API_TOKEN,
      secret: TWILIO_API_SECRET,
    };

    const ssoOptions = {
      ssoUrl: SYNOLOGY_SSO_URL,
      ssoAppId: SYNOLOGY_SSO_APP_ID,
      allowedGroup: SYNOLOGY_ALLOWED_GROUP,
      inboundNumber: TWILIO_ALLOWED_PHONE_NUMBER_INBOUND,
      outboundNumber: TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND,
    };

    setRoutes(app, twilioOptions, ssoOptions);

    app.listen(PORT, "0.0.0.0", () => {
      console.debug(`API instance running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
