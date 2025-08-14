import axios from "axios";

const cache = new Map();

/**
 * @param {string} messageSid
 * @returns {Promise<string>} public url for the media
 */
export const getTwilioMedia = async messageSid => {
  if (cache.has(messageSid)) {
    return cache.get(messageSid);
  }

  let result = [];
  const url = `/api/messages/${messageSid}/media`;
  const response = await axios.get(url);

  if (response?.data?.media?.media_list?.length > 0) {
    result = response.data.media.media_list.map(m => {
      const suffix = m.uri.substring(0, m.uri.indexOf(".json"));
      return `https://api.twilio.com/${suffix}`;
    });
  }
  cache.set(messageSid, result);
  return result;
};
