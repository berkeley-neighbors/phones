import axios from "axios";

export const sendTwilioMessage = async (to = "", body = "") => {
  const url = `/api/messages`;
  const response = await axios.post(
    url,
    {
      to,
      body,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data.sid;
};
