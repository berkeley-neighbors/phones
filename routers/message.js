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

  const getMessagesUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const getMessageBySidUrl = messageSid => {
    return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}.json`;
  };

  const getMessageMediaUrl = messageSid => {
    return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}/Media.json`;
  };

  const getAuthorizationHeader = () => {
    return `Basic ${Buffer.from(`${TWILIO_API_TOKEN}:${TWILIO_API_SECRET}`).toString("base64")}`;
  };

  router.get("/", auth, async (req, res) => {
    const { from, to, filter } = req.query;

    console.log("Fetching messages with params:", { from, to, filter });
    try {
      const config = await configClient.getValuesByKeys(["inbound_number", "outbound_number"]);

      const requests = [];
      if (filter) {
        if (filter === "all" || filter === "received") {
          requests.push(
            fetch(
              `${getMessagesUrl()}?${new URLSearchParams({
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

        if (filter === "all" || filter === "sent") {
          requests.push(
            fetch(
              `${getMessagesUrl()}?${new URLSearchParams({
                From: config.get("outbound_number"),
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
        if (from) {
          requests.push(
            fetch(
              `${getMessagesUrl()}?${new URLSearchParams({
                From: from,
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

        if (to) {
          requests.push(
            fetch(
              `${getMessagesUrl()}?${new URLSearchParams({
                To: to,
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
      }

      const responses = await Promise.all(requests);
      const messages = [];
      for (const response of responses) {
        if (response.status === 403) {
          return res.status(403).send("Forbidden: Not authenticated");
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }
        const data = await response.json();
        messages.push(...data.messages);
      }

      res.status(200).json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  router.post("/", auth, async (req, res) => {
    const { to, body } = req.body;
    if (!to || !body) {
      return res.status(400).send("Bad Request: Missing To or Body");
    }

    try {
      const config = await configClient.getValuesByKeys("outbound_number");

      console.debug("Sending message:", { to, body });
      const response = await fetch(
        `${getMessagesUrl()}?${new URLSearchParams({
          To: to,
          From: config.get("outbound_number"),
          Body: body,
        })}`,
        {
          method: "POST",
          headers: {
            Authorization: getAuthorizationHeader(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      if (response.statusCode === 403) {
        return res.status(403).send("Forbidden: Not authenticated");
      }

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      res.status(200).json(await response.json());
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  router.get("/:messageSid/media", auth, async (req, res) => {
    const messageSid = req.params.messageSid;
    if (!messageSid) {
      return res.status(400).send("Bad Request: Missing message SID");
    }

    try {
      const url = getMessageMediaUrl(messageSid);
      const response = await fetch(url, {
        headers: {
          Authorization: getAuthorizationHeader(),
        },
      });

      res.status(200).json(await response.json());
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  router.get("/:messageSid", auth, async (req, res) => {
    const messageSid = req.params.messageSid;
    if (!messageSid) {
      return res.status(400).send("Bad Request: Missing message SID");
    }

    try {
      const url = getMessageBySidUrl(messageSid);
      console.log("Fetching message by SID:", url);
      const response = await fetch(url, {
        headers: {
          Authorization: getAuthorizationHeader(),
        },
      });

      res.status(200).json(await response.json());
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
}
