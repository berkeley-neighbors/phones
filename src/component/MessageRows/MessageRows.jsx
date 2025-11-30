import { InboxOutlined, SendOutlined } from "@ant-design/icons";
import { fromNow } from "../../js/util";
import { isEmpty } from "lodash";
import { MessageDirection } from "../../js/types";
import { MediaViewer } from "../MediaViewer/MediaViewer";
import { LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
/**
 * @typedef {import("../../js/types").Message} Message
 */

/**
 * @param {Message} message
 * @returns {boolean}
 */
const isRead = message => message.isRead ?? false;

/**
 * @param {Message} message
 * @returns {string}
 */
const isReadContent = message => (isRead(message) ? "bg-gray-200 text-gray-600" : "bg-white");

/**
 * @param {Message} message
 * @returns {string}
 */
const isReadHeader = message => (isRead(message) ? "text-gray-400" : "text-gray-500");

/**
 * @param {Message} message
 * @returns {string}
 */
const messageBody = message =>
  isEmpty(message.body) && message.hasMedia ? "Message contains attachments" : message.body;

/**
 * @param {Message} message
 */
const MessageIcon = ({ message }) =>
  MessageDirection.received === message.direction ? (
    <InboxOutlined className="block text-[1.2rem] text-purple-900 w-8" />
  ) : (
    <SendOutlined className="block text-[1rem] text-purple-900 w-8" />
  );

/**
 * @param {Message} message
 */
const MessageRow = (message, onClick) => {
  return (
    <div
      key={message.messageSid}
      onClick={() => onClick(message)}
      className={`flex
  ${isReadContent(message)}
  border-b-2 border-l-2 pr-1 min-h-32
  hover:bg-purple-100 hover:cursor-pointer hover:border-l-purple-400
  active:bg-purple-200`}
    >
      <div className="flex items-center justify-center">
        <MessageIcon message={message} />
      </div>
      <div className="grow">
        <div className={`${isReadHeader(message)} text-xs my-2 overflow-clip font-sans font-light`}>
          <span className="inline-block w-32">
            <b>To:</b>
            {message.to}
          </span>
          <span className="inline-block w-36">
            <b>From:</b>
            {message.from}
          </span>
          <span className="hidden md:inline-block">
            {message.direction} {fromNow(message.date)}
          </span>
        </div>
        <div className="line-clamp-3">{messageBody(message)}</div>
        {message.media > 0 && (
          <div className="flex justify-center mb-2">
            <MediaViewer messageSid={message.messageSid} thumbnail="true" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Conversation card showing a phone number and message count
 */
const ConversationCard = ({ phoneNumber, messageCount, latestMessage, onClick }) => {
  const hasUnread = !isRead(latestMessage);
  const isReceived = latestMessage.direction === MessageDirection.received;

  return (
    <div key={phoneNumber} onClick={onClick} className="mb-4 cursor-pointer">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="font-semibold text-gray-800">{phoneNumber}</span>
        <span className="text-xs text-gray-500">{fromNow(latestMessage.date)}</span>
      </div>
      <div className={`flex ${isReceived ? "justify-start" : "justify-end"}`}>
        <div className={`max-w-[85%] ${isReceived ? "" : "flex flex-col items-end"}`}>
          <div
            className={`px-4 py-3 rounded-lg ${
              hasUnread
                ? isReceived
                  ? "bg-white border-2 border-violet-500 shadow-md"
                  : "bg-violet-700 text-white shadow-md"
                : isReceived
                  ? "bg-gray-100 border border-gray-300"
                  : "bg-violet-500 text-white opacity-90"
            } hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center gap-2 mb-2 text-xs opacity-75">
              {isReceived ? <InboxOutlined className="text-sm" /> : <SendOutlined className="text-sm" />}
              <span className={hasUnread ? "font-semibold" : ""}>
                {messageCount} {messageCount === 1 ? "message" : "messages"}
              </span>
            </div>
            <div className={`line-clamp-2 ${hasUnread && isReceived ? "font-medium text-gray-900" : ""}`}>
              {messageBody(latestMessage)}
            </div>
            {latestMessage.media > 0 && <div className="mt-2 text-xs opacity-75">📎 Has attachments</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageRows = ({ loading = true, messages = [] }) => {
  const navigate = useNavigate();

  const handleConversationClick = phoneNumber => {
    navigate(`/conversation/${phoneNumber}`);
  };

  if (loading)
    return (
      <div className="text-center mt-16">
        <LoadingOutlined className="text-6xl text-purple-900" />
      </div>
    );

  // Group messages by the other party (for received messages: from, for sent messages: to)
  const groupedMessages = messages.reduce((groups, message) => {
    const key = message.direction === MessageDirection.received ? message.from : message.to;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
    return groups;
  }, {});

  // Sort groups by most recent message
  const sortedGroups = Object.entries(groupedMessages).sort(([, messagesA], [, messagesB]) => {
    const latestA = new Date(messagesA[0].date);
    const latestB = new Date(messagesB[0].date);
    return latestB - latestA;
  });

  return (
    <div className="space-y-2">
      {sortedGroups.map(([phoneNumber, groupMessages]) => (
        <ConversationCard
          key={phoneNumber}
          phoneNumber={phoneNumber}
          messageCount={groupMessages.length}
          latestMessage={groupMessages[0]}
          onClick={() => handleConversationClick(phoneNumber)}
        />
      ))}
    </div>
  );
};
