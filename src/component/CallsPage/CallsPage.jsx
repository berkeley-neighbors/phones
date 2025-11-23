import { useEffect, useState, useContext } from "react";
import { PhoneOutlined, PhoneFilled, LoadingOutlined } from "@ant-design/icons";
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

const CallIcon = ({ call }) =>
  call.direction === "inbound" ? (
    <PhoneOutlined className="block text-[1.2rem] text-purple-900 w-8" />
  ) : (
    <PhoneFilled className="block text-[1rem] text-purple-900 w-8" />
  );

const CallRow = ({ call }) => {
  return (
    <div
      key={call.sid}
      className="flex bg-white border-b-2 border-l-2 pr-1 min-h-32 hover:bg-purple-100 hover:cursor-pointer hover:border-l-purple-400 active:bg-purple-200"
    >
      <div className="flex items-center justify-center">
        <CallIcon call={call} />
      </div>
      <div className="grow">
        <div className="text-gray-500 text-xs my-2 overflow-clip font-sans font-light">
          <span className="inline-block w-32">
            <b>To:</b> {call.to}
          </span>
          <span className="inline-block w-36">
            <b>From:</b> {call.from}
          </span>
          <span className="hidden md:inline-block">
            {call.direction} {fromNow(call.date_created)}
          </span>
        </div>
        <div className="mb-2">
          <span className={`font-medium ${getStatusColor(call.status)}`}>{call.status}</span>
          <span className="text-gray-600"> • Duration: {formatDuration(call.duration)}</span>
        </div>
      </div>
    </div>
  );
};

const CallsList = ({ loading, calls }) => {
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
    <div className="border-2 border-b-0 border-l-0">
      {calls.map(call => (
        <CallRow key={call.sid} call={call} />
      ))}
    </div>
  );
};

export const CallsPage = () => {
  const api = useContext(APIContext);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [callFilter, setCallFilter] = useState(CallFilterEnum.received);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (callFilter) {
          params.append("filter", callFilter);
        }

        const response = await fetch(`/api/calls?${params.toString()}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch calls: ${response.statusText}`);
        }

        const data = await response.json();

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
    <Layout>
      <h3>Call Logs</h3>
      <div className="mb-4">
        <sub>View call history</sub>
      </div>

      <ErrorLabel error={error} className="mb-4" />

      <CallFilter onChange={setCallFilter} />
      <CallsList loading={loading} calls={calls} />
    </Layout>
  );
};
