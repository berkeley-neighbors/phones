import { isEmpty } from "lodash";

export const buildUrl = () => "/api/config/values?keys=inbound_number,outbound_number";

/**
 * Represents the config response with phone number values.
 * @typedef {Object} ConfigResponse
 * @property {string} inbound - The inbound phone number.
 * @property {string} outbound - The outbound phone number.
 */

let cache = {};
/**
 * @returns {Promise<Array<string>>}
 */
export const getTwilioPhoneNumbers = async api => {
  if (isEmpty(cache)) {
    const response = await api.get(buildUrl());

    cache = response?.data;
    return cache;
  }

  return cache;
};
