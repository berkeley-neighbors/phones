import { MessageDirection } from "./types";

/**
 * @typedef {import('./types').Message} Message
 */

const toMessage = (v = {}) => ({
  messageSid: v.sid,
  direction: v.direction.includes("inbound") ? MessageDirection.received : MessageDirection.sent,
  from: v.from,
  to: v.to,
  date: v.date_created,
  status: v.status,
  body: v.body,
  media: parseInt(v.num_media),
});

export const sortByDate = (a, b) => (Date.parse(a.date) > Date.parse(b.date) ? -1 : 1);

/**
 * @returns {Promise<Array<Message>>}
 */
export const getTwilioMessages = async (api, { from = "", to = "", filter }) => {
  const url = `/api/messages`;

  const params = {};
  if (to.length > 0) {
    params.to = to;
  }

  if (from.length > 0) {
    params.from = from;
  }

  if (filter) {
    params.filter = filter;
  }

  const response = await api.get(url, {
    params,
  });

  let messages = response.data.messages.map(toMessage).sort(sortByDate);

  messages.forEach(message => {
    const matchingAnnotation = response.data.annotations?.find(a => a.sid === message.messageSid);
    if (matchingAnnotation) {
      message.annotation = matchingAnnotation;
    } else {
      message.annotation = null;
    }
  });

  return messages;
};

/**
 * @returns {Promise<Message>}
 */
export const getTwilioMessage = async (api, messageSid = "") => {
  const url = `/api/messages/${messageSid}`;

  const response = await api.get(url);

  const message = toMessage(response.data.message);

  message.annotation = response.data.annotation || null;

  return message;
};
