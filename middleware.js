import { getEnvironmentVariable } from "./get-environment-variable.js";

const SYNOLOGY_SSO_URL = getEnvironmentVariable("SYNOLOGY_SSO_URL");
const SYNOLOGY_SSO_APP_ID = getEnvironmentVariable("SYNOLOGY_SSO_APP_ID");
const AUTH_METHOD = getEnvironmentVariable("AUTH_METHOD");
const ANONYMOUS_UID = 1;

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

async function synologyAuth(req, res, next) {
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

    // Although redundant, move this lookup in explicit fetching path
    if (data?.data?.user_id) {
      req.uid = data.data.user_id;
    }
  } catch (error) {
    console.error("Error parsing token exchange response:", error);
    return res.status(500).send("Internal Server Error");
  }

  next();
}

function noAuth(req, __, next) {
  req.uid = ANONYMOUS_UID;

  next();
}

export async function auth(req, res, next) {
  if (AUTH_METHOD === "synology") {
    return synologyAuth(req, res, next);
  } else if (AUTH_METHOD === "none") {
    return noAuth(req, res, next);
  }
}
