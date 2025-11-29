import { URL } from "url";
import { Buffer } from "buffer";
import { staff, phonebook } from "./routers/index.js";
import { auth } from "./middleware.js";

export function setRoutes(app, { accountSID, token, secret }, { ssoUrl, allowedGroup, inboundNumber, outboundNumber }) {
  const getMessagesUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${accountSID}/Messages.json`;

  const getCallsUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${accountSID}/Calls.json`;

  const getMessageBySidUrl = messageSid => {
    return `https://api.twilio.com/2010-04-01/Accounts/${accountSID}/Messages/${messageSid}.json`;
  };

  const getMessageMediaUrl = messageSid => {
    return `https://api.twilio.com/2010-04-01/Accounts/${accountSID}/Messages/${messageSid}/Media.json`;
  };

  // This is a stand-in for permissions based on the original fork's logic.
  // Should be replaced.
  const getPhoneNumbersUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${accountSID}/IncomingPhoneNumbers.json`;

  const getAuthorizationHeader = () => {
    return `Basic ${Buffer.from(`${token}:${secret}`).toString("base64")}`;
  };

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/messages", auth, async (req, res) => {
    const { from, to, filter } = req.query;

    console.log("Fetching messages with params:", { from, to, filter });
    try {
      const requests = [];
      if (filter) {
        if (filter === "all" || filter === "received") {
          requests.push(
            fetch(
              `${getMessagesUrl()}?${new URLSearchParams({
                To: inboundNumber,
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
                From: inboundNumber,
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
                To: inboundNumber,
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
                From: inboundNumber,
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
                To: inboundNumber,
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
                From: inboundNumber,
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

  app.post("/messages", auth, async (req, res) => {
    const { to, body } = req.body;
    if (!to || !body) {
      return res.status(400).send("Bad Request: Missing To or Body");
    }

    console.debug("Sending message:", { to, body });
    console.debug("Using outbound number:", outboundNumber);
    try {
      const response = await fetch(
        `${getMessagesUrl()}?${new URLSearchParams({
          To: to,
          From: outboundNumber,
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

  app.get("/messages/:messageSid/media", auth, async (req, res) => {
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

  app.get("/messages/:messageSid", auth, async (req, res) => {
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
          return details.phone_number === outboundNumber;
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

  app.use("/staff", staff);
  app.use("/phonebook", phonebook);
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

      if (allowedGroup) {
        const groupCheckUrl = new URL("/webapi/entry.cgi", ssoUrl);
        groupCheckUrl.searchParams.append("api", "SYNO.Core.Group.Member");
        groupCheckUrl.searchParams.append("version", "1");
        groupCheckUrl.searchParams.append("method", "list");
        groupCheckUrl.searchParams.append("group", allowedGroup);
        groupCheckUrl.searchParams.append("SynoToken", synotoken);
        groupCheckUrl.searchParams.append("_sid", sid);

        console.debug("Checking group membership for:", allowedGroup);

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
          console.error("User not in allowed group:", allowedGroup);
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
