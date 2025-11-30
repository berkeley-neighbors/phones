import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers";
import { sendTwilioMessage } from "../../js/sendTwilioMessage";
import { phonePattern } from "../../js/util";
import { Layout } from "../Layout/Layout";
import { ErrorLabel } from "../ErrorLabel/ErrorLabel";
import { SendOutlined, LoadingOutlined } from "@ant-design/icons";

import { useContext } from "react";
import { APIContext } from "@/context/APIContext";

export const SendPage = () => {
  const { number: toParam } = useParams();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(toParam ?? "");
  const [message, setMessage] = useState("");
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const api = useContext(APIContext);

  useEffect(() => {
    getTwilioPhoneNumbers(api)
      .then(phonesNumbers => setFrom(phonesNumbers.outbound_number || ""))
      .catch(setError)
      .finally(() => setLoadingPhoneNumbers(false));
  }, []);

  const handleToOnChange = e => {
    const val = e.target.value;
    setTo("+" + val.replace(/\D/g, ""));
  };

  const handleSend = () => {
    if (sendingMessage) return;

    setSendingMessage(true);
    sendTwilioMessage(api, to, message)
      .catch(setError)
      .then(messageSid => navigate(`/sent/${messageSid}`))
      .finally(() => setSendingMessage(false));
  };

  const handleKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isValid = () => {
    const isValidTo = to.match(phonePattern) !== null;
    const isValidMessage = message.length > 0 && message.length < 500;
    return !sendingMessage && isValidTo && isValidMessage;
  };

  return (
    <Layout title="Send">
      <div className="mb-4">
        <sub>Text to any number</sub>
      </div>
      <ErrorLabel error={error} className="mb-4" />

      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="mb-3">
          <label className="text-sm font-semibold text-gray-700 block mb-1">From:</label>
          {loadingPhoneNumbers ? (
            <div className="w-full h-10 animate-pulse bg-gray-200 rounded" />
          ) : (
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
              value={from}
              disabled={true}
            />
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">To:</label>
          <input
            type="tel"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={to}
            pattern={phonePattern}
            onChange={handleToOnChange}
            disabled={sendingMessage}
            placeholder="+1234567890"
          />
        </div>
      </div>

      {message && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <div className="flex justify-end mb-2">
            <div className="max-w-[70%]">
              <div className="px-4 py-3 rounded-lg bg-violet-600 text-white">
                <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
                  <SendOutlined className="text-sm" />
                  <span>Preview</span>
                </div>
                <div className="whitespace-pre-wrap break-words">{message}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-300 rounded-lg shadow-lg">
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Type your message..."
            onChange={e => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            value={message}
            minLength="1"
            maxLength="500"
            disabled={sendingMessage}
            rows="3"
          />
          <button
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            onClick={handleSend}
            disabled={!isValid()}
          >
            {sendingMessage ? <LoadingOutlined /> : <SendOutlined />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters • Press Enter to send</p>
      </div>
    </Layout>
  );
};
