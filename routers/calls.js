import express from "express";
import { auth } from "../middleware.js";
import { Buffer } from "buffer";
import { getEnvironmentVariable } from "../get-environment-variable.js";
import { ConfigClient } from "../clients/config.js";

const TWILIO_ACCOUNT_SID = getEnvironmentVariable("TWILIO_ACCOUNT_SID");
const TWILIO_API_TOKEN = getEnvironmentVariable("TWILIO_API_TOKEN");
const TWILIO_API_SECRET = getEnvironmentVariable("TWILIO_API_SECRET");

export function Router(db) {
  const router = express.Router();
  const configClient = new ConfigClient(db);

  const getCallsUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

  const getCallUrl = callSid =>
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls/${callSid}.json`;

  const getAuthorizationHeader = () => {
    return `Basic ${Buffer.from(`${TWILIO_API_TOKEN}:${TWILIO_API_SECRET}`).toString("base64")}`;
  };

  router.get("/", auth, async (req, res) => {
    const { filter } = req.query;

    console.log("Fetching calls with params:", { filter });
    try {
      const config = await configClient.getValuesByKeys(["inbound_number"]);

      const requests = [];
      if (filter) {
        if (filter === "all" || filter === "received") {
          requests.push(
            fetch(
              `${getCallsUrl()}?${new URLSearchParams({
                To: config.get("inbound_number"),
              }).toString()}`,
              {
                headers: {
                  Authorization: getAuthorizationHeader(),
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              },
            ),
          );
        }

        if (filter === "all" || filter === "made") {
          requests.push(
            fetch(
              `${getCallsUrl()}?${new URLSearchParams({
                From: config.get("inbound_number"),
              }).toString()}`,
              {
                headers: {
                  Authorization: getAuthorizationHeader(),
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              },
            ),
          );
        }
      } else {
        requests.push(
          fetch(getCallsUrl(), {
            headers: {
              Authorization: getAuthorizationHeader(),
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }),
        );
      }

      const responses = await Promise.all(requests);
      const calls = [];
      for (const response of responses) {
        if (response.status === 403) {
          return res.status(403).send("Forbidden: Not authenticated");
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch calls: ${response.statusText}`);
        }
        const data = await response.json();
        calls.push(...data.calls);
      }

      res.status(200).json({ calls });
    } catch (error) {
      console.error("Error fetching calls:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  router.get("/:callSid", auth, async (req, res) => {
    const { callSid } = req.params;

    console.log("Fetching call with SID:", callSid);
    try {
      const response = await fetch(getCallUrl(callSid), {
        headers: {
          Authorization: getAuthorizationHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.status === 403) {
        return res.status(403).send("Forbidden: Not authenticated");
      }

      if (response.status === 404) {
        return res.status(404).send("Call not found");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch call: ${response.statusText}`);
      }

      const call = await response.json();
      res.status(200).json(call);
    } catch (error) {
      console.error("Error fetching call:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
}
