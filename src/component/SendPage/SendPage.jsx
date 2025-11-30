import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers";
import { sendTwilioMessage } from "../../js/sendTwilioMessage";
import { phonePattern } from "../../js/util";
import { Layout } from "../Layout/Layout";
import { ErrorLabel } from "../ErrorLabel/ErrorLabel";
import { Loading3QuartersOutlined } from "@ant-design/icons";

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

  const Input = ({ loading = true, value = "", disabled = false }) => {
    if (loading) return <input type="text" className="w-full animate-pulse" value="Loading..." disabled />;
    return <input type="text" className="w-full" value={value} disabled={disabled} />;
  };

  const isValid = () => {
    const isValidTo = to.match(phonePattern) !== null;
    const isValidMessage = message.length > 0 && message.length < 500;
    return !sendingMessage && isValidTo && isValidMessage;
  };

  const hint = `Send a message from  ${from === "" ? "?" : from}  to  ${to === "" ? "?" : to}`;

  return (
    <Layout title="Send Message">
      <div className="mb-4">
        <sub>Text to any number</sub>
      </div>
      <ErrorLabel error={error} className="mb-4" />
      <div className="flex items-center">
        <label className="w-14">From:</label>
        <div className="flex gap-2 mb-2">
          {loadingPhoneNumbers ? (
            <div className="w-full animate-pulse h-10 bg-gray-200" />
          ) : (
            <div className={`relative`}>
              <label className="w-full flex">
                <Input loading={loadingPhoneNumbers} value={from} disabled={true} />
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center mt-2">
        <label className="w-14">To:</label>
        <input type="tel" value={to} pattern={phonePattern} onChange={handleToOnChange} disabled={sendingMessage} />
      </div>
      <textarea
        className="w-full mt-2 p-2"
        placeholder={hint}
        onChange={i => setMessage(i.target.value)}
        minLength="1"
        maxLength="500"
        disabled={sendingMessage}
        rows="5"
      ></textarea>
      <p className="text-xs font-thin m-0">Messages must be between 1 and 500 characters.</p>
      <button className="float-right" onClick={handleSend} disabled={!isValid()}>
        {!sendingMessage && "Send"}
        {sendingMessage && <Loading3QuartersOutlined spin="true" />}
      </button>
    </Layout>
  );
};
