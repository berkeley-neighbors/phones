import "./MediaViewer.css";
import { useEffect, useState } from "react";
import { getTwilioMedia } from "../../js/getTwilioMedia";
import { LoadingOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { APIContext } from "@/context/APIContext";
import { useContext } from "react";

const Loading = () => (
  <div className="message-viewer-loading">
    <LoadingOutlined className="text-primary" />
    <span className="message-viewer-loading-text">Loading media...</span>
  </div>
);

export const MediaViewer = ({ messageSid = "", thumbnail = false }) => {
  const api = useContext(APIContext);

  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState([]);

  useEffect(() => {
    getTwilioMedia(api, messageSid)
      .then(m => setMedia(m))
      .catch(err => console.log("TODO: Create a warning component for the user to know about the failure", err))
      .then(() => setLoading(false));
  }, [messageSid, setMedia, setLoading]);

  if (loading) {
    return <Loading />;
  }

  if (isEmpty(media)) {
    return null;
  }

  return (
    <>
      {media.map(m => (
        <img
          className={`message-viewer-content ${thumbnail ? "thumbnail" : ""}`}
          key={m}
          src={m}
          alt="Attached media file (MMS)"
        />
      ))}
    </>
  );
};
