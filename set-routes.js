import { URL } from "url";
import { StaffRouter, PhonebookRouter, MessageRouter, ConfigRouter, CallsRouter } from "./routers/index.js";
import { auth } from "./middleware.js";
import { getEnvironmentVariable } from "./get-environment-variable.js";
import express from "express";

const ssoUrl = getEnvironmentVariable("SYNOLOGY_SSO_URL");
const SYNOLOGY_ALLOWED_GROUP = getEnvironmentVariable("SYNOLOGY_ALLOWED_GROUP", "");
const AUTH_METHOD = getEnvironmentVariable("AUTH_METHOD");

if (AUTH_METHOD === "synology") {
  const requiredVars = ["SYNOLOGY_API_USERNAME", "SYNOLOGY_API_PASSWORD"];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(
      `Fatal: AUTH_METHOD is "synology" but the following required environment variables are not set: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

const SYNOLOGY_API_USERNAME = getEnvironmentVariable("SYNOLOGY_API_USERNAME", "");
const SYNOLOGY_API_PASSWORD = getEnvironmentVariable("SYNOLOGY_API_PASSWORD", "");

export function setRoutes(app, basePath, db) {
  const baseRouter = express.Router();

  app.use(basePath || "/", baseRouter);

  baseRouter.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  baseRouter.post("/register", async (req, res) => {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).send("Bad Request: Missing accessToken parameter");
    }

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      signed: true,
      maxAge: 60 * 60 * 1000 * 24 * 7, // 1 week
    });

    console.info("Access token registered successfully");
    res.status(200).send("OK");
  });

  baseRouter.use("/messages", MessageRouter(db));
  baseRouter.use("/staff", StaffRouter());
  baseRouter.use("/phonebook", PhonebookRouter());
  baseRouter.use("/config", ConfigRouter(db));
  baseRouter.use("/calls", CallsRouter(db));
  baseRouter.use("/session-token", auth);

  async function getSynologySessionToken(req, res) {
    const accessToken = req.signedCookies && req.signedCookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized: No access token" });
    }

    try {
      const apiUrl = new URL("/webapi/entry.cgi?api=SYNO.API.Auth", ssoUrl);
      apiUrl.searchParams.append("version", "7");
      apiUrl.searchParams.append("method", "login");

      console.log("Authenticating with Synology API");

      const response = await fetch(apiUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api: "SYNO.API.Auth",
          token: accessToken,
          enable_syno_token: "yes",
          type: "sso",
          version: "7",
          method: "login",
          ssotype: "synosso",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to authenticate with Synology: ${response.statusText}`);
      }

      const parsed = await response.json();

      if (!parsed.success) {
        console.error("Synology authentication error:", parsed.error);
        return res.status(500).json({ error: "Failed to authenticate with Synology" });
      }

      const { synotoken, account } = parsed.data;

      if (SYNOLOGY_ALLOWED_GROUP) {
        // Authenticate with the dedicated admin account for group queries
        const adminAuthUrl = new URL("/webapi/entry.cgi?api=SYNO.API.Auth", ssoUrl);
        adminAuthUrl.searchParams.append("version", "7");
        adminAuthUrl.searchParams.append("method", "login");

        console.log("Authenticating admin account for group membership check");

        const adminAuthResponse = await fetch(adminAuthUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            api: "SYNO.API.Auth",
            account: SYNOLOGY_API_USERNAME,
            passwd: SYNOLOGY_API_PASSWORD,
            enable_syno_token: "yes",
            version: "7",
            method: "login",
          }),
        });

        if (!adminAuthResponse.ok) {
          throw new Error(`Failed to authenticate admin account: ${adminAuthResponse.statusText}`);
        }

        const adminAuth = await adminAuthResponse.json();

        if (!adminAuth.success) {
          console.error("Admin authentication error:", adminAuth.error);
          return res.status(500).json({ error: "Failed to authenticate admin account for group check" });
        }

        const adminSynoToken = adminAuth.data.synotoken;
        const adminSid = adminAuth.data.sid;

        const groupCheckUrl = new URL("/webapi/entry.cgi", ssoUrl);
        groupCheckUrl.searchParams.append("api", "SYNO.Core.Group.Member");
        groupCheckUrl.searchParams.append("version", "1");
        groupCheckUrl.searchParams.append("method", "list");
        groupCheckUrl.searchParams.append("group", SYNOLOGY_ALLOWED_GROUP);
        groupCheckUrl.searchParams.append("SynoToken", adminSynoToken);
        groupCheckUrl.searchParams.append("_sid", adminSid);

        console.debug("Checking group membership for:", SYNOLOGY_ALLOWED_GROUP);
        const groupResponse = await fetch(groupCheckUrl.toString(), {
          headers: {
            Accept: "application/json",
          },
        });

        if (!groupResponse.ok) {
          throw new Error(`Failed to check group membership: ${groupResponse.statusText}`);
        }

        const result = await groupResponse.json();

        if (!result.success) {
          console.error("Group membership check failed:", result.error);
          return res.status(403).json({ error: "Access denied: User not in allowed group" });
        }

        const hasMembership = result.data.users.find(user => user.name === account);

        if (!hasMembership) {
          console.error("User not in allowed group:", SYNOLOGY_ALLOWED_GROUP);
          return res.status(403).json({ error: "Access denied: User not in allowed group" });
        }
      }

      res.status(200).json({
        token: synotoken,
      });
    } catch (error) {
      console.error("Error authenticating with Synology:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  baseRouter.get("/session-token", async (req, res) => {
    if (AUTH_METHOD == "none") {
      return res.status(200).json({ token: "none" });
    }

    if (AUTH_METHOD == "synology") {
      return getSynologySessionToken(req, res);
    }

    return res.status(500).json({ error: "Internal Server Error" });
  });
}
