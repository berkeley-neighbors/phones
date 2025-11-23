import { CloseOutlined } from "@ant-design/icons";
import "./Snackbar.css";

export const Snackbar = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="snackbar-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`snackbar snackbar-${notification.type}`}>
          <div className="snackbar-content">
            <span className="snackbar-message">{notification.message}</span>
            <button
              className="snackbar-dismiss"
              onClick={() => onDismiss(notification.id)}
              aria-label="Dismiss notification"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
