import {
  InboxOutlined,
  SendOutlined,
  TeamOutlined,
  PhoneOutlined,
  BookOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Snackbar } from "../Snackbar/Snackbar";
import { useSnackbar } from "@/context/SnackbarContext";

const FOOTER_TEXT = import.meta.env.VITE_FOOTER_TEXT || "";
const DRAWER_TEXT = import.meta.env.VITE_DRAWER_TEXT || "";
const HEADER_SUBTITLE_TEXT = import.meta.env.VITE_HEADER_SUBTITLE_TEXT || "";
const DrawerItem = ({ icon: Icon, label, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-4 px-6 py-4 hover:bg-violet-700 cursor-pointer text-white">
    <Icon className="text-xl" />
    <span className="text-base">{label}</span>
  </div>
);

const NavigationDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleNavigation = path => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-violet-900 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-violet-700">
          <h2 className="text-white text-lg font-semibold">{DRAWER_TEXT}</h2>
          <CloseOutlined className="text-white text-xl cursor-pointer hover:text-gray-300" onClick={onClose} />
        </div>
        <nav className="mt-2">
          <DrawerItem icon={InboxOutlined} label="Inbox" onClick={() => handleNavigation("/")} />
          <DrawerItem icon={SendOutlined} label="Send" onClick={() => handleNavigation("/send")} />
          <DrawerItem icon={PhoneOutlined} label="Calls" onClick={() => handleNavigation("/calls")} />
          <DrawerItem icon={TeamOutlined} label="Staff" onClick={() => handleNavigation("/staff")} />
          <DrawerItem icon={BookOutlined} label="Directory" onClick={() => handleNavigation("/phonebook")} />
          <DrawerItem icon={FileTextOutlined} label="Runbook" onClick={() => handleNavigation("/runbook")} />
          <DrawerItem icon={CalendarOutlined} label="Schedule" onClick={() => handleNavigation("/schedule")} />
          <DrawerItem icon={SettingOutlined} label="Config" onClick={() => handleNavigation("/config")} />
        </nav>
      </div>
    </>
  );
};

const Footer = () => (
  <div className="w-full py-2 text-white flex flex-col items-center text-xs gap-1">
    <h2 className="text-lg">{FOOTER_TEXT}</h2>
  </div>
);

export const Layout = ({ children, title }) => {
  const { notifications, dismissNotification } = useSnackbar();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div className="bg-violet-900 flex justify-center">
        <div className="h-14 w-full max-w-screen-lg flex items-center px-4 gap-4">
          <MenuOutlined
            className="text-white text-xl cursor-pointer hover:text-gray-300"
            onClick={() => setIsDrawerOpen(true)}
          />
          {title && <h3 className="text-white text-lg font-semibold m-0">{title}</h3>}
          {HEADER_SUBTITLE_TEXT && <span className="text-violet-300 text-sm ml-auto">{HEADER_SUBTITLE_TEXT}</span>}
        </div>
      </div>
      <div className="grow flex justify-center">
        <div className="block bg-gray-50 w-full max-w-screen-lg p-4">{children}</div>
      </div>
      <div className="bg-violet-900">
        <Footer />
      </div>
      <Snackbar notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};
