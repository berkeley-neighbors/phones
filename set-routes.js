import { URL } from "url";
import { Buffer } from "buffer";
import { StaffRouter, PhonebookRouter, MessageRouter } from "./routers/index.js";
import { auth } from "./middleware.js";
import { getEnvironmentVariable } from "./get-environment-variable.js";

const ssoUrl = getEnvironmentVariable("SYNOLOGY_SSO_URL");
const TWILIO_ACCOUNT_SID = getEnvironmentVariable("TWILIO_ACCOUNT_SID");
const TWILIO_API_TOKEN = getEnvironmentVariable("TWILIO_API_TOKEN");
const TWILIO_API_SECRET = getEnvironmentVariable("TWILIO_API_SECRET");
const SYNOLOGY_ALLOWED_GROUP = getEnvironmentVariable("SYNOLOGY_ALLOWED_GROUP", "");

const TWILIO_ALLOWED_PHONE_NUMBER_INBOUND = getEnvironmentVariable("TWILIO_ALLOWED_PHONE_NUMBER_INBOUND");
const TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND = getEnvironmentVariable("TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND");

export function setRoutes(app) {
  const getCallsUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

  // This is a stand-in for permissions based on the original fork's logic.
  // Should be replaced.
  const getPhoneNumbersUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;
  const getAuthorizationHeader = () => {
    return `Basic ${Buffer.from(`${TWILIO_API_TOKEN}:${TWILIO_API_SECRET}`).toString("base64")}`;
  };

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/calls", auth, async (req, res) => {
    const { filter } = req.query;

    console.log("Fetching calls with params:", { filter });
    try {
      const requests = [];
      if (filter) {
        if (filter === "all" || filter === "received") {
          requests.push(
            fetch(
              `${getCallsUrl()}?${new URLSearchParams({
                To: TWILIO_ALLOWED_PHONE_NUMBER_INBOUND,
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
                From: TWILIO_ALLOWED_PHONE_NUMBER_INBOUND,
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

  app.get("/phone-numbers", auth, async (req, res) => {
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
          return details.phone_number === TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND;
        });
      }

      res.status(200).json({ ...data, incoming_phone_numbers: filteredPhoneNumbers });
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/register", async (req, res) => {
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

  app.use(
    "/messages",
    MessageRouter(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_TOKEN,
      TWILIO_API_SECRET,
      TWILIO_ALLOWED_PHONE_NUMBER_INBOUND,
      TWILIO_ALLOWED_PHONE_NUMBER_OUTBOUND,
    ),
  );
  app.use("/staff", StaffRouter());
  app.use("/phonebook", PhonebookRouter());
  app.use("/session-token", auth);

  app.get("/session-token", async (req, res) => {
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

      const { synotoken, sid, account } = parsed.data;

      if (SYNOLOGY_ALLOWED_GROUP) {
        const groupCheckUrl = new URL("/webapi/entry.cgi", ssoUrl);
        groupCheckUrl.searchParams.append("api", "SYNO.Core.Group.Member");
        groupCheckUrl.searchParams.append("version", "1");
        groupCheckUrl.searchParams.append("method", "list");
        groupCheckUrl.searchParams.append("group", SYNOLOGY_ALLOWED_GROUP);
        groupCheckUrl.searchParams.append("SynoToken", synotoken);
        groupCheckUrl.searchParams.append("_sid", sid);

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
  });
}
