import axios from "axios";
import { MessageDirection } from "./types";
import { UnauthorizedError } from "./errors";

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
export const getTwilioMessages = async ({ from = "", to = "", filter }) => {
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

  const response = await axios.get(url, {
    params,
  });

  if (response.status === 401) {
    throw new UnauthorizedError("Unauthorized");
  }

  return response.data.messages.map(toMessage).sort(sortByDate);
};

/**
 * @returns {Promise<Message>}
 */
export const getTwilioMessage = async (messageSid = "") => {
  const url = `/api/messages/${messageSid}`;

  const response = await axios.get(url);

  return toMessage(response.data);
};
