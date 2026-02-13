import { Buffer } from "buffer";
import { getEnvironmentVariable } from "../get-environment-variable.js";
import { ConfigClient } from "./config.js";

const TWILIO_ACCOUNT_SID = getEnvironmentVariable("TWILIO_ACCOUNT_SID");
const TWILIO_API_TOKEN = getEnvironmentVariable("TWILIO_API_TOKEN");
const TWILIO_API_SECRET = getEnvironmentVariable("TWILIO_API_SECRET");

const getMessagesUrl = () => `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

const getAuthorizationHeader = () => {
  return `Basic ${Buffer.from(`${TWILIO_API_TOKEN}:${TWILIO_API_SECRET}`).toString("base64")}`;
};

export class NotificationClient {
  constructor(db) {
    this.configClient = new ConfigClient(db);
  }

  async sendSMS(to, body) {
    const config = await this.configClient.getValuesByKeys("outbound_number");
    const from = config.get("outbound_number");

    if (!from) {
      throw new Error("Outbound number not configured");
    }

    const response = await fetch(
      `${getMessagesUrl()}?${new URLSearchParams({
        To: to,
        From: from,
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

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    return response.json();
  }
}
