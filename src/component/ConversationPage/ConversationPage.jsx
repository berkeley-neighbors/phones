import { useParams } from "react-router-dom";
import { Layout } from "../Layout/Layout";
import { useEffect, useState } from "react";
import { getTwilioMessages, sortByDate } from "../../js/getTwilioMessages";
import { APIContext } from "@/context/APIContext";
import { useContext } from "react";
import { InboxOutlined, SendOutlined, LoadingOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { fromNow } from "../../js/util";
import { isEmpty } from "lodash";
import { MessageDirection } from "../../js/types";
import { MediaViewer } from "../MediaViewer/MediaViewer";
import { useNavigate } from "react-router-dom";
import { sendTwilioMessage } from "../../js/sendTwilioMessage";

const messageBody = message =>
  isEmpty(message.body) && message.hasMedia ? "Message contains attachments" : message.body;

const MessageBubble = ({ message, hasError = false, isOptimistic = false }) => {
  const navigate = useNavigate();
  const isReceived = message.direction === MessageDirection.received;

  const handleClick = () => {
    if (!isOptimistic && !hasError) {
      navigate(`/message/${message.messageSid}`);
    }
  };

  return (
    <div className={`flex mb-4 ${isReceived ? "justify-start" : "justify-end"}`} onClick={handleClick}>
      <div className={`max-w-[70%] min-w-0 ${isReceived ? "" : "flex flex-col items-end"}`}>
        <div
          className={`px-4 py-3 rounded-lg overflow-hidden ${!isOptimistic && !hasError ? "cursor-pointer" : ""} ${
            hasError
              ? "bg-red-100 border-2 border-red-500 text-red-900"
              : isReceived
                ? "bg-white border border-gray-300 hover:bg-gray-50"
                : `bg-violet-600 text-white ${!isOptimistic ? "hover:bg-violet-700" : "opacity-70"}`
          }`}
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
            {hasError ? (
              <>
                <ExclamationCircleOutlined className="text-sm" />
                <span>Failed to send</span>
              </>
            ) : (
              <>
                {isReceived ? <InboxOutlined className="text-sm" /> : <SendOutlined className="text-sm" />}
                <span>{isOptimistic ? "Sending..." : fromNow(message.date)}</span>
              </>
            )}
          </div>
          <div className="whitespace-pre-wrap" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {messageBody(message)}
          </div>
          {hasError && <div className="mt-2 text-xs font-semibold">Message failed to send. Please try again.</div>}
          {message.media > 0 && !isOptimistic && (
            <div className="mt-2">
              <MediaViewer messageSid={message.messageSid} thumbnail="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ConversationPage = () => {
  const api = useContext(APIContext);
  const { number } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [failedMessages, setFailedMessages] = useState(new Set());

  useEffect(() => {
    const ft = getTwilioMessages(api, { to: number });
    const tf = getTwilioMessages(api, { from: number });
    Promise.all([ft, tf])
      .then(msg => setMessages(msg.flat().sort(sortByDate)))
      .then(() => setLoading(false));
  }, [number]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg = {
      messageSid: optimisticId,
      direction: MessageDirection.sent,
      from: "",
      to: number,
      body: newMessage,
      date: new Date().toISOString(),
      media: 0,
      isOptimistic: true,
    };

    // Just add now
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    try {
      const messageSid = await sendTwilioMessage(api, number, newMessage);

      // Remove optimistic message and add real one once we got it
      setOptimisticMessages(prev => prev.filter(m => m.messageSid !== optimisticId));

      // Refresh messages for now
      const ft = getTwilioMessages(api, { to: number });
      const tf = getTwilioMessages(api, { from: number });
      const msg = await Promise.all([ft, tf]);
      setMessages(msg.flat().sort(sortByDate));
    } catch (error) {
      console.error("Failed to send message:", error);

      // It died
      setFailedMessages(prev => new Set([...prev, optimisticId]));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const allMessages = [...messages, ...optimisticMessages].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loading) {
    return (
      <Layout title="Conversation">
        <div className="text-center mt-16">
          <LoadingOutlined className="text-6xl text-purple-900" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Conversation">
      <p className="my-4">
        Messages exchanged with <span className="font-semibold">{number}</span>
      </p>
      <div className="bg-gray-100 p-4 rounded-lg min-h-[400px] mb-4">
        {allMessages.map(message => (
          <MessageBubble
            key={message.messageSid}
            message={message}
            isOptimistic={message.isOptimistic}
            hasError={failedMessages.has(message.messageSid)}
          />
        ))}
        {allMessages.length === 0 && (
          <div className="text-center text-gray-500 py-8">No messages in this conversation</div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-300 rounded-lg shadow-lg">
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Type your message..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            rows="2"
            maxLength="500"
          />
          <button
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? <LoadingOutlined /> : <SendOutlined />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{newMessage.length}/500 characters • Press Enter to send</p>
      </div>
    </Layout>
  );
};
