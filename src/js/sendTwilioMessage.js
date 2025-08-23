export const sendTwilioMessage = async (api, to = "", body = "") => {
  const url = `/api/messages`;
  const response = await api.post(
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
