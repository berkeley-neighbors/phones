import { getTwilioMessages, sortByDate } from "../../js/getTwilioMessages";
import { allPhones, MessageFilterEnum } from "./Selector";

/**
 * @typedef {import ("../../js/getTwilioMessages").Message} Message
 */

/**
 *
 * @returns {Promise<Array<Message>>}
 */
export const getMessages = async (api, phoneNumber = allPhones, filter = MessageFilterEnum.all) => {
  if (MessageFilterEnum.all === filter) {
    return await getTwilioMessages(api, {
      filter: "all",
    });
  }

  if (MessageFilterEnum.received === filter) {
    return await getTwilioMessages(api, {
      filter: "received",
    });
  }

  if (MessageFilterEnum.sent === filter) {
    return await getTwilioMessages(api, {
      filter: "sent",
    });
  }

  const from = await getTwilioMessages(api, {
    from: phoneNumber,
  });

  const to = await getTwilioMessages(api, {
    to: phoneNumber,
  });

  return from.concat(to).sort(sortByDate);
};
