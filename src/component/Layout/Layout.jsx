import { InboxOutlined, SendOutlined, TeamOutlined, PhoneOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Snackbar } from "../Snackbar/Snackbar";
import { useSnackbar } from "@/context/SnackbarContext";

const FOOTER_TEXT = import.meta.env.VITE_FOOTER_TEXT || "";

const NavItem = ({ className, children, onClick = () => {} }) => (
  <span
    onClick={onClick}
    className={`h-14 flex flex-col justify-center items-center px-4 hover:bg-violet-700 hover:cursor-pointer ${className}`}
  >
    {children}
  </span>
);

const NavBar = () => {
  const navigate = useNavigate();

  const navigateToInbox = () => {
    navigate("/");
  };

  const navigateToSend = () => {
    navigate("/send");
  };

  const navigateToStaff = () => {
    navigate("/staff");
  };

  const navigateToCalls = () => {
    navigate("/calls");
  };

  const navigateToPhoneBook = () => {
    navigate("/phonebook");
  };

  return (
    <>
      <nav className="flex justify-between text-white px-1 sm:px-4">
        <div className="flex">
          <NavItem onClick={navigateToInbox}>
            <InboxOutlined className="text-lg" />
            <span className="mt-1">Inbox</span>
          </NavItem>
          <NavItem onClick={navigateToSend}>
            <SendOutlined className="text-lg" />
            <span className="mt-1">Send</span>
          </NavItem>
          <NavItem onClick={navigateToCalls}>
            <PhoneOutlined className="text-lg" />
            <span className="mt-1">Calls</span>
          </NavItem>
          <NavItem onClick={navigateToStaff}>
            <TeamOutlined className="text-lg" />
            <span className="mt-1">Staff</span>
          </NavItem>
          <NavItem onClick={navigateToPhoneBook}>
            <BookOutlined className="text-lg" />
            <span className="mt-1">Directory</span>
          </NavItem>
        </div>
      </nav>
    </>
  );
};

const Footer = () => (
  <div className="w-full py-2 text-white flex flex-col items-center text-xs gap-1">
    <h2 className="text-lg">{FOOTER_TEXT}</h2>
  </div>
);

export const Layout = ({ children }) => {
  const { notifications, dismissNotification } = useSnackbar();

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      <div className="bg-violet-900 flex justify-center">
        <span className="block h-14 w-full max-w-screen-lg">
          <NavBar />
        </span>
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
