const cache = new Map();

/**
 * @param {string} messageSid
 * @returns {Promise<string>} public url for the media
 */
export const getTwilioMedia = async (api, messageSid) => {
  if (cache.has(messageSid)) {
    return cache.get(messageSid);
  }

  let result = [];
  const url = `/api/messages/${messageSid}/media`;
  const response = await api.get(url);

  if (response?.data?.media_list?.length > 0) {
    result = response.data.media_list.map(m => {
      return `/api/messages/${messageSid}/media/${m.sid}`;
    });
  }
  cache.set(messageSid, result);
  return result;
};
