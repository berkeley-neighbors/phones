import { useEffect, useState, useContext } from "react";
import { PhoneOutlined, PhoneFilled, LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout/Layout";
import { ErrorLabel } from "../ErrorLabel/ErrorLabel";
import { APIContext } from "@/context/APIContext";
import { fromNow } from "../../js/util";

const CallFilterEnum = {
  all: "all",
  received: "received",
  made: "made",
};

const CallFilter = ({ onChange }) => {
  return (
    <div className="mb-4">
      <select
        onChange={e => onChange(e.target.value)}
        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
        defaultValue={CallFilterEnum.received}
      >
        <option value={CallFilterEnum.all}>All Calls</option>
        <option value={CallFilterEnum.received}>Received</option>
        <option value={CallFilterEnum.made}>Made</option>
      </select>
    </div>
  );
};

const formatDuration = seconds => {
  if (!seconds || seconds === "0") return "No answer";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

const CallRow = ({ call, onClick }) => {
  const isInbound = call.direction === "inbound";
  const hasAnswer = call.duration && call.duration !== "0";

  return (
    <div key={call.sid} className="mb-4 cursor-pointer" onClick={() => onClick(call.sid)}>
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="font-semibold text-gray-800 truncate">{isInbound ? call.from : call.to}</span>
        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{fromNow(call.date_created)}</span>
      </div>
      <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
        <div className={`max-w-[85%] min-w-0 ${isInbound ? "" : "flex flex-col items-end"}`}>
          <div
            className={`px-4 py-3 rounded-lg overflow-hidden ${
              isInbound
                ? hasAnswer
                  ? "bg-white border border-gray-300 shadow-sm"
                  : "bg-gray-100 border border-gray-300"
                : hasAnswer
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-violet-400 text-white opacity-90"
            } hover:shadow-lg transition-shadow`}
            style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            <div className="flex items-center gap-2 mb-2 text-xs opacity-75">
              {isInbound ? <PhoneOutlined className="text-sm" /> : <PhoneFilled className="text-sm" />}
              <span className="font-semibold">{isInbound ? "Incoming" : "Outgoing"} Call</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-medium ${getStatusColor(call.status)}`}>{call.status}</span>
              <span className="text-sm">Duration: {formatDuration(call.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CallsList = ({ loading, calls, onCallClick }) => {
  if (loading) {
    return (
      <div className="text-center mt-16">
        <LoadingOutlined className="text-6xl text-purple-900" />
      </div>
    );
  }

  if (!calls || calls.length === 0) {
    return <div className="text-center py-8 text-gray-500">No calls found</div>;
  }

  return (
    <div className="space-y-2">
      {calls.map(call => (
        <CallRow key={call.sid} call={call} onClick={onCallClick} />
      ))}
    </div>
  );
};

export const CallsPage = () => {
  const api = useContext(APIContext);
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callFilter, setCallFilter] = useState(CallFilterEnum.received);
  const [error, setError] = useState(null);

  const handleCallClick = callSid => {
    navigate(`/call/${callSid}`);
  };

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (callFilter) {
          params.append("filter", callFilter);
        }

        const { data } = await api.get(`/api/calls?${params.toString()}`);

        // Sort calls by date, most recent first
        const sortedCalls = (data.calls || []).sort((a, b) => {
          return new Date(b.date_created) - new Date(a.date_created);
        });

        setCalls(sortedCalls);
      } catch (err) {
        console.error("Error fetching calls:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [api, callFilter]);

  return (
    <Layout title="Call Logs">
      <div className="mb-4">
        <sub>View call history</sub>
      </div>

      <ErrorLabel error={error} className="mb-4" />

      <CallFilter onChange={setCallFilter} />
      <CallsList loading={loading} calls={calls} onCallClick={handleCallClick} />
    </Layout>
  );
};
