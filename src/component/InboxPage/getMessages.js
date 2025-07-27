import { getTwilioMessages, sortByDate } from "../../js/getTwilioMessages";
import { allPhones, MessageFilterEnum } from "./Selector";

/**
 * @typedef {import ("../../js/getTwilioMessages").Message} Message
 */

/**
 *
 * @returns {Promise<Array<Message>>}
 */
export const getMessages = async (phoneNumber = allPhones, filter = MessageFilterEnum.all) => {
  if (MessageFilterEnum.all === filter) {
    return await getTwilioMessages({
      filter: "all",
    });
  }

  if (MessageFilterEnum.received === filter) {
    return await getTwilioMessages({
      filter: "received",
    });
  }

  if (MessageFilterEnum.sent === filter) {
    return await getTwilioMessages({
      filter: "sent",
    });
  }

  const from = await getTwilioMessages({
    from: phoneNumber,
  });

  const to = await getTwilioMessages({
    to: phoneNumber,
  });

  return from.concat(to).sort(sortByDate);
};
