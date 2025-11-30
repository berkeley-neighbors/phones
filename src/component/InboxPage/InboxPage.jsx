import { useEffect, useState } from "react";
import { Layout } from "../Layout/Layout";
import { MessageRows } from "../MessageRows/MessageRows";
import { MessageFilterEnum, Selector } from "./Selector";
import { getTwilioPhoneNumbers } from "../../js/getTwilioPhoneNumbers";
import { getMessages } from "./getMessages";
import { ErrorLabel } from "../ErrorLabel/ErrorLabel";
import { APIContext } from "@/context/APIContext";
import { useContext } from "react";

export const InboxPage = () => {
  const api = useContext(APIContext);
  const [messages, setMessages] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingPhones, setLoadingPhones] = useState(true);
  const [messageFilter, setMessageFilter] = useState(MessageFilterEnum.received);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoadingMessages(true);
      try {
        const ms = await getMessages(api, phoneNumber, messageFilter);
        setMessages(ms);
      } finally {
        setLoadingMessages(false);
      }
    };
    run();
  }, [phoneNumber, messageFilter]);

  useEffect(() => {
    getTwilioPhoneNumbers(api)
      .then(phoneNumbers => {
        setPhoneNumber(phoneNumbers.inbound_number || "");
      })
      .catch(setError)
      .finally(() => setLoadingPhones(false));
  }, []);

  return (
    <Layout title="Inbox">
      <div className="mb-4">
        <sub>View and reply to text messages</sub>
      </div>
      <ErrorLabel error={error} className="mb-4" />

      <Selector
        phoneNumber={phoneNumber}
        loading={loadingPhones}
        onMessageFilterChange={setMessageFilter}
        onPhoneNumberChange={setPhoneNumber}
      />
      <MessageRows loading={loadingMessages} messages={messages} />
    </Layout>
  );
};
