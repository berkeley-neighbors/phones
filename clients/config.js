import { getEnvironmentVariable } from "../get-environment-variable.js";
import { Buffer } from "buffer";

const TWILIO_ACCOUNT_SID = getEnvironmentVariable("TWILIO_ACCOUNT_SID");
const TWILIO_API_TOKEN = getEnvironmentVariable("TWILIO_API_TOKEN");
const TWILIO_API_SECRET = getEnvironmentVariable("TWILIO_API_SECRET");

const getAuthorizationHeader = () => {
  return `Basic ${Buffer.from(`${TWILIO_API_TOKEN}:${TWILIO_API_SECRET}`).toString("base64")}`;
};

const getPhoneNumbersUrl = () =>
  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;

const CONFIG_KEYS = {
  INBOUND_NUMBER: "inbound_number",
  OUTBOUND_NUMBER: "outbound_number",
};

export class ConfigClient {
  constructor(db) {
    this.db = db;
    this.configCollection = db.collection("config");
  }

  async #setConfig(key, payload) {
    try {
      // Probably a created at should be here for when it's first created
      // TODO: Who is the user?
      const result = await this.configCollection.updateOne(
        { key },
        {
          $set: {
            key,
            value: payload,
            updated_at: new Date(),
          },
        },
        { upsert: true },
      );

      console.debug(`Config ${key} updated: ${result.modifiedCount} modified, ${result.upsertedCount} inserted`);

      return result;
    } catch (error) {
      console.error(`Error updating config by key ${key}:`, error);
      throw error;
    }
  }

  // TODO: Ideally set up a twilio service/client to handle this
  async #fetchTwilioPhoneNumbers() {
    try {
      const twilioResponse = await fetch(getPhoneNumbersUrl(), {
        headers: {
          Authorization: getAuthorizationHeader(),
        },
      });

      if (!twilioResponse.ok) {
        throw new Error(`Failed to fetch phone numbers from Twilio: ${twilioResponse.statusText}`);
      }

      const twilioData = await twilioResponse.json();
      return twilioData.incoming_phone_numbers.map(num => ({
        value: num.phone_number,
        label: num.friendly_name,
      }));
    } catch (error) {
      console.error("Error fetching Twilio phone numbers:", error);
      throw error;
    }
  }

  async getValuesByKeys(keys) {
    const validKeys = new Set(Object.values(CONFIG_KEYS));
    const requestedKeys = Array.isArray(keys) ? keys : [keys];

    // Dumb simple validation
    for (const key of requestedKeys) {
      if (!validKeys.has(key)) {
        throw new Error(`Invalid config key: ${key}`);
      }
    }

    console.debug("Retrieving config values for keys:", requestedKeys);

    const configs = await this.configCollection.find({ key: { $in: requestedKeys } }).toArray();

    return new Map(configs.map(config => [config.key, config.value]));
  }

  // Intended to be transformed off supported keys
  async getValueOptions() {
    try {
      const availableNumbers = await this.#fetchTwilioPhoneNumbers();
      const currentValues = await this.getValuesByKeys(Object.values(CONFIG_KEYS));

      return {
        inbound_number: {
          key: CONFIG_KEYS.INBOUND_NUMBER,
          value: currentValues.get("inbound_number"),
          options: availableNumbers,
        },
        outbound_number: {
          key: CONFIG_KEYS.OUTBOUND_NUMBER,
          value: currentValues.get("outbound_number"),
          options: availableNumbers,
        },
      };
    } catch (error) {
      console.error("Error getting value options:", error);
      throw error;
    }
  }

  async setValues(payload) {
    try {
      const { inbound_number, outbound_number } = payload;

      if (!inbound_number || !outbound_number) {
        throw new Error("Both inbound and outbound numbers are required");
      }

      // TODO: Set together
      await this.#setConfig(CONFIG_KEYS.INBOUND_NUMBER, inbound_number);
      await this.#setConfig(CONFIG_KEYS.OUTBOUND_NUMBER, outbound_number);

      return {
        message: "Configuration updated successfully",
        ...payload,
      };
    } catch (error) {
      console.error("Error setting values:", error);
      throw error;
    }
  }
}
