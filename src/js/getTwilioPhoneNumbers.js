import { isEmpty } from "lodash";

export const buildUrl = () => "/api/phone-numbers";

/**
 * Represents a collection of incoming phone numbers and pagination details.
 * @typedef {Object} TwilioPhoneNumberResponse
 * @property {string} first_page_uri - The URI of the first page of the incoming phone numbers list.
 * @property {number} end - The position of the last item on the current page.
 * @property {string|null} previous_page_uri - The URI of the previous page, if available.
 * @property {IncomingPhoneNumber[]} incoming_phone_numbers - A list of incoming phone numbers.
 */

/**
 * Represents a single incoming phone number and its details.
 * @typedef {Object} IncomingPhoneNumber
 * @property {string} origin - The origin of the phone number.
 * @property {string} status - The current status of the phone number.
 * @property {Capabilities} capabilities - The capabilities of the phone number.
 * @property {string} phone_number - The phone number in E.164 format.
 */

/**
 * Represents the capabilities of a phone number.
 * @typedef {Object} Capabilities
 * @property {boolean} fax - Indicates if fax is supported.
 * @property {boolean} voice - Indicates if voice is supported.
 * @property {boolean} sms - Indicates if SMS is supported.
 * @property {boolean} mms - Indicates if MMS is supported.
 */

let cache = [];
/**
 * @returns {Promise<Array<string>>}
 */
export const getTwilioPhoneNumbers = async api => {
  if (isEmpty(cache)) {
    const response = await api.get(buildUrl());

    cache = response?.data?.incoming_phone_numbers
      .filter(pn => pn?.capabilities?.sms)
      .map(pn => pn?.phone_number)
      .sort();
    return cache;
  }
  return cache;
};
