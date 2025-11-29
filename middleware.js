import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { getEnvironmentVariable } from "./get-environment-variable.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYNOLOGY_SSO_URL = getEnvironmentVariable("SYNOLOGY_SSO_URL");
const SYNOLOGY_SSO_APP_ID = getEnvironmentVariable("SYNOLOGY_SSO_APP_ID");

export function addBaseStack(router, cookieSecret) {
  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());
  router.use(cookieParser(cookieSecret));

  // Serve static files from dist in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "dist");
    router.use(express.static(distPath));
    console.log(`Serving static files from: ${distPath}`);
  }
}

export function mongo(client, name) {
  const db = client.db(name);
  return function (req, _, next) {
    req.db = db;
    next();
  };
}

mongo.read = function (req) {
  return req.db;
};

export function collection(name) {
  return function (req, _, next) {
    req.collection = mongo.read(req).collection(name);
    next();
  };
}

collection.read = function (req) {
  return req.collection;
};

export async function auth(req, res, next) {
  const tokenExchangeAction = "exchange";
  const tokenExchangePath = "/webman/sso/SSOAccessToken.cgi";
  const accessToken = req.signedCookies && req.signedCookies.accessToken;

  if (!accessToken) {
    console.error("No accessToken cookie found");
    return res.status(401).json({ error: "Unauthorized: No accessToken cookie found" });
  }

  const tokenExchangeURL = new URL(tokenExchangePath, SYNOLOGY_SSO_URL);
  tokenExchangeURL.searchParams.append("action", tokenExchangeAction);
  tokenExchangeURL.searchParams.append("app_id", SYNOLOGY_SSO_APP_ID);
  tokenExchangeURL.searchParams.append("access_token", accessToken);

  const parsed = await fetch(tokenExchangeURL.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!parsed.ok) {
    console.error(`Failed to validate access token: ${parsed.statusText}`);
    return res.status(500).send("Internal Server Error");
  }

  try {
    const data = await parsed.json();

    if (!data) {
      console.error("No data returned from token exchange");
      return res.status(401).send("Unauthorized: Invalid access token");
    }

    if (!data.success) {
      console.error("Token exchange failed:", data.error);
      return res.status(401).send("Unauthorized: Invalid access token");
    }
  } catch (error) {
    console.error("Error parsing token exchange response:", error);
    return res.status(500).send("Internal Server Error");
  }

  next();
}
