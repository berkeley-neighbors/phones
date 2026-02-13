import {
  InboxOutlined,
  SendOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
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
const ConversationCard = ({
  phoneNumber,
  messageCount,
  latestMessage,
  onClick,
  conversationNote,
  onNotesClick,
  onDoneToggle,
}) => {
  const isReceived = latestMessage.direction === MessageDirection.received;
  const isSender = latestMessage.annotation;
  const isDone = conversationNote?.done ?? false;
  const hasNotes = conversationNote?.notes?.length > 0;

  let wrappingClasses = "bg-violet-500 text-white opacity-90";

  if (isReceived) {
    wrappingClasses = "bg-gray-100 border border-gray-300";
  } else {
    wrappingClasses = "text-white opacity-90";

    if (isSender) {
      wrappingClasses += " bg-amber-800 ";
    } else {
      wrappingClasses += " bg-violet-800 ";
    }
  }

  return (
    <div key={phoneNumber} className={`mb-4 ${isDone ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-2 px-2">
        <span
          className={`font-semibold truncate ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}
          onClick={onClick}
          role="button"
        >
          {phoneNumber}
        </span>
        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{fromNow(latestMessage.date)}</span>
      </div>
      <div className="cursor-pointer" onClick={onClick}>
        <div
          className={`flex items-center px-4 py-3 rounded-lg overflow-hidden ${wrappingClasses} hover:shadow-lg transition-shadow`}
        >
          <div className="flex-1 min-w-0" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
            <div className="flex items-center gap-2 mb-2 text-xs opacity-75">
              {isReceived ? <InboxOutlined className="text-sm" /> : <SendOutlined className="text-sm" />}
              <span>
                {messageCount} {messageCount === 1 ? "message" : "messages"}
              </span>
            </div>
            <div className="line-clamp-2" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
              {messageBody(latestMessage)}
            </div>
            {latestMessage.media > 0 && <div className="mt-2 text-xs opacity-75">📎 Has attachments</div>}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 ml-4">
            <button
              onClick={e => {
                e.stopPropagation();
                onNotesClick(phoneNumber);
              }}
              className={`bg-transparent border-none p-2 cursor-pointer text-gray-800 hover:text-black hover:bg-transparent transition-colors ${hasNotes ? "text-amber-700" : ""}`}
              title={hasNotes ? "Edit notes" : "Add notes"}
            >
              <FileTextOutlined className="text-xl" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDoneToggle(phoneNumber);
              }}
              className={`bg-transparent border-none p-2 cursor-pointer text-gray-800 hover:text-black hover:bg-transparent transition-colors ${isDone ? "text-green-700" : ""}`}
              title={isDone ? "Mark as not done" : "Mark as done"}
            >
              {isDone ? <CheckCircleFilled className="text-xl" /> : <CheckCircleOutlined className="text-xl" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageRows = ({ loading = true, messages = [], conversationNotes = {}, onNotesClick, onDoneToggle }) => {
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

  if (messages.length === 0)
    return (
      <div className="text-center mt-16">
        <InboxOutlined className="text-6xl text-gray-300" />
        <p className="mt-4 text-gray-500 text-lg">No messages yet</p>
        <p className="mt-1 text-gray-400 text-sm">Messages will appear here when they arrive</p>
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
          conversationNote={conversationNotes[phoneNumber]}
          onNotesClick={onNotesClick}
          onDoneToggle={onDoneToggle}
        />
      ))}
    </div>
  );
};
