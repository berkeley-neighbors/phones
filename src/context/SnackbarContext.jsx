import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SnackbarContext = createContext();

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

export const SnackbarProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();

  // Dismiss as we move
  useEffect(() => {
    setNotifications([]);
  }, [location.pathname]);

  const addNotification = (message, type = "info") => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
    };
    setNotifications(prev => [...prev, notification]);
  };

  const dismissNotification = id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const value = {
    notifications,
    addNotification,
    dismissNotification,
  };

  return <SnackbarContext.Provider value={value}>{children}</SnackbarContext.Provider>;
};
