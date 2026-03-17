/**
 * @param {import("axios").AxiosInstance} api
 * @param {string[]} phoneNumbers
 * @returns {Promise<Array<{ phoneNumber: string, notes: string, done: boolean }>>}
 */
export const getConversationNotes = async (api, phoneNumbers) => {
  const response = await api.get("/api/conversation-notes", {
    params: { phoneNumbers: phoneNumbers.join(",") },
  });
  return response.data;
};

/**
 * @param {import("axios").AxiosInstance} api
 * @param {string} phoneNumber
 * @param {{ notes?: string, done?: boolean }} data
 * @returns {Promise<{ phoneNumber: string, notes: string, done: boolean }>}
 */
export const updateConversationNote = async (api, phoneNumber, data) => {
  const encoded = encodeURIComponent(phoneNumber);
  const response = await api.put(`/api/conversation-notes/${encoded}`, data, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
};
