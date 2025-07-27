import express from "express";
import fs from "fs/promises";
import path from "path";
import { Buffer } from "buffer";
import { config } from "dotenv";
import process from "process";
const app = express();

function getEnvironmentVariable(name, defaultValue) {
  let variable = process.env[name];
  if (!variable) {
    if (defaultValue) {
      return defaultValue;
    }

    config(); // Should be one-time operation

    variable = process.env[name];

    if (!variable) {
      throw new Error(`Environment variable ${name} is not set and no default value provided`);
    }
  }

  return variable;
}

const PORT = 4000;
const PHONE_NUMBERS_FILE = getEnvironmentVariable("PHONE_NUMBERS_FILE", "./phone-numbers.json");
const REPLY_MESSAGE = getEnvironmentVariable("REPLY_MESSAGE", "Welcome! You have been registered for updates.");
const API_TOKEN = getEnvironmentVariable("API_TOKEN");
const TWILIO_ALLOWED_PHONE_NUMBER = getEnvironmentVariable("TWILIO_ALLOWED_PHONE_NUMBER");
const TWILIO_ACCOUNT_SID = getEnvironmentVariable("TWILIO_ACCOUNT_SID");
const TWILIO_API_TOKEN = getEnvironmentVariable("TWILIO_API_TOKEN");
const TWILIO_API_SECRET = getEnvironmentVariable("TWILIO_API_SECRET");

const getMessagesUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

const getMessageBySidUrl = messageSid => {
  return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}.json`;
};

const getMessageMediaUrl = messageSid => {
  return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}/Media.json`;
};

// This is a stand-in for permissions based on the original fork's logic.
// Should be replaced.
const getPhoneNumbersUrl = () =>
  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;

const getAuthorizationHeader = () => {
  return `Basic ${Buffer.from(`${TWILIO_API_TOKEN}:${TWILIO_API_SECRET}`).toString("base64")}`;
};

if (!API_TOKEN) {
  throw new Error("API_TOKEN environment variable is required");
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function to read phone numbers from file
const readPhoneNumbers = async () => {
  try {
    const data = await fs.readFile(PHONE_NUMBERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    console.log(`Phone numbers file not found or invalid, starting with empty list: ${error.message}`);
    return [];
  }
};

// Helper function to write phone numbers to file
const writePhoneNumbers = async phoneNumbers => {
  try {
    // Ensure directory exists
    const dir = path.dirname(PHONE_NUMBERS_FILE);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(PHONE_NUMBERS_FILE, JSON.stringify(phoneNumbers, null, 2));
  } catch (error) {
    console.error(`Error writing phone numbers file: ${error.message}`);
    throw error;
  }
};

// Twilio webhook endpoint
app.post("/webhook", async (req, res) => {
  if (req.query.token !== API_TOKEN) {
    console.error("Invalid API token");
    return res.status(403).send("Forbidden: Invalid token");
  }

  try {
    console.log("Received webhook:", req.body);

    // Extract phone number from Twilio webhook payload
    const fromNumber = req.body.From;

    if (!fromNumber) {
      console.error("No phone number found in webhook payload");
      return res.status(400).send("Bad Request: Missing From field");
    }

    // Read existing phone numbers
    const phoneNumbers = await readPhoneNumbers();

    // Check if phone number already exists
    if (phoneNumbers.includes(fromNumber)) {
      console.log(`Phone number ${fromNumber} already exists, no action taken`);
      return res.status(200).send("OK");
    }

    // Add new phone number and save
    phoneNumbers.push(fromNumber);
    await writePhoneNumbers(phoneNumbers);

    console.log(`Added new phone number: ${fromNumber}`);

    // Send TwiML response with reply message
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${REPLY_MESSAGE}</Message>
</Response>`;

    res.set("Content-Type", "text/xml");
    res.status(200).send(twimlResponse);
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Twilio webhook server running on port ${PORT}`);
  console.log(`Phone numbers file: ${PHONE_NUMBERS_FILE}`);
  console.log(`Reply message: ${REPLY_MESSAGE}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

app.get("/messages", async (req, res) => {
  const { from, to, filter } = req.query;

  console.log("Fetching messages with params:", { from, to, filter });
  try {
    const requests = [];
    if (filter) {
      if (filter === "all" || filter === "received") {
        requests.push(
          fetch(
            `${getMessagesUrl()}?${new URLSearchParams({
              To: TWILIO_ALLOWED_PHONE_NUMBER,
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
              From: TWILIO_ALLOWED_PHONE_NUMBER,
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
              To: TWILIO_ALLOWED_PHONE_NUMBER,
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
              From: TWILIO_ALLOWED_PHONE_NUMBER,
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

app.post("/messages", async (req, res) => {
  const { to, body } = req.body;
  if (!to || !body) {
    return res.status(400).send("Bad Request: Missing To or Body");
  }

  console.log("Sending message:", { to, body });
  try {
    const response = await fetch(
      `${getMessagesUrl()}?${new URLSearchParams({
        To: to,
        From: TWILIO_ALLOWED_PHONE_NUMBER,
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

app.get("/messages/:messageSid", async (req, res) => {
  const messageSid = req.params.messageSid;
  if (!messageSid) {
    return res.status(400).send("Bad Request: Missing message SID");
  }

  try {
    const url = getMessageBySidUrl(messageSid);
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

app.get("/messages/:messageSid/media", async (req, res) => {
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

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/phone-numbers", async (req, res) => {
  try {
    const response = await fetch(getPhoneNumbersUrl(), {
      headers: {
        Authorization: getAuthorizationHeader(),
      },
    });

    if (response.statusCode === 401) {
      return res.status(401).send("Unauthorized: Invalid credentials");
    }

    if (response.statusCode === 403) {
      return res.status(403).send("Forbidden: Not authenticated");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch phone numbers: ${response.statusText}`);
    }

    let filteredPhoneNumbers = [];
    const data = await response.json();

    if (data.incoming_phone_numbers) {
      filteredPhoneNumbers = data.incoming_phone_numbers.filter(details => {
        return details.phone_number === TWILIO_ALLOWED_PHONE_NUMBER;
      });
    }

    res.status(200).json({ ...data, incoming_phone_numbers: filteredPhoneNumbers });
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    res.status(500).send("Internal Server Error");
  }
});
