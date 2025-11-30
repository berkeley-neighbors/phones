import { useEffect, useState, useContext } from "react";
import { Layout } from "../Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { LoadingOutlined, CopyOutlined, PhoneOutlined } from "@ant-design/icons";
import { ErrorLabel } from "../ErrorLabel/ErrorLabel";
import { APIContext } from "@/context/APIContext";
import { fromNow, copyToClipboard } from "../../js/util";

const formatDuration = seconds => {
  if (!seconds || seconds === "0") return "No answer";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatFullDate = dateString => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getStatusColor = status => {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "busy":
    case "no-answer":
    case "failed":
      return "text-red-600";
    case "in-progress":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
};

const CallInfo = ({ call }) => {
  const isInbound = call.direction === "inbound";

  return (
    <div
      className="p-4 border-2 bg-white rounded overflow-hidden"
      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
    >
      <div className="mb-3">
        <span className="inline-block w-full max-w-60 py-1">
          <b>Direction:</b> <span className="capitalize">{call.direction}</span>
        </span>
      </div>
      <div className="mb-3">
        <span className="inline-block w-full max-w-60 py-1">
          <b>Status:</b> <span className={`capitalize font-medium ${getStatusColor(call.status)}`}>{call.status}</span>
        </span>
        <span className="hover:cursor-pointer active:text-gray-600 break-all" onClick={() => copyToClipboard(call.to)}>
          <CopyOutlined className="text-gray-500 pr-1" />
          <b>To:</b> {call.to}
        </span>
      </div>
      <div className="mb-3">
        <span className="inline-block w-full max-w-60 py-1">
          <b>Duration:</b> {formatDuration(call.duration)}
        </span>
        <span
          className="hover:cursor-pointer active:text-gray-600 break-all"
          onClick={() => copyToClipboard(call.from)}
        >
          <CopyOutlined className="text-gray-500 pr-1" />
          <b>From:</b> {call.from}
        </span>
      </div>
      <div className="mb-3">
        <span className="inline-block w-full py-1">
          <b>Call ID:</b> <span className="text-xs text-gray-600 break-all">{call.sid}</span>
        </span>
      </div>
      <div className="mb-3">
        <span className="inline-block w-full py-1">
          <b>Date & Time:</b> {formatFullDate(call.date_created)}
        </span>
      </div>
      <div className="mb-3">
        <span className="inline-block w-full py-1">
          <b>Time Ago:</b> {fromNow(call.date_created)}
        </span>
      </div>
      {call.price && (
        <div className="mb-3">
          <span className="inline-block w-full py-1">
            <b>Price:</b> {call.price} {call.price_unit}
          </span>
        </div>
      )}
    </div>
  );
};

const CallPanel = ({ call }) => {
  const navigate = useNavigate();
  const isInbound = call.direction === "inbound";
  const destination = isInbound ? call.from : call.to;

  return (
    <>
      <CallInfo call={call} />
      <div className="mt-4 text-right space-x-4">
        <button onClick={() => navigate("/calls")}>
          <PhoneOutlined /> Back to Calls
        </button>
        <button onClick={() => navigate(`/send/${destination}`)}>Send Message</button>
      </div>
    </>
  );
};

export const CallDetailsPage = () => {
  const { callSid } = useParams();
  const [call, setCall] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useContext(APIContext);

  useEffect(() => {
    const fetchCall = async () => {
      try {
        const { data } = await api.get(`/api/calls/${callSid}`);
        setCall(data);
      } catch (err) {
        console.error("Error fetching call:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCall();
  }, [callSid, api]);

  return (
    <Layout title="Call Details">
      <ErrorLabel error={error} />
      <p className="my-4">More details about this call.</p>
      {loading && (
        <p className="mt-10 text-purple-900 text-5xl text-center">
          <LoadingOutlined />
        </p>
      )}
      {!loading && !error && <CallPanel call={call} />}
    </Layout>
  );
};
