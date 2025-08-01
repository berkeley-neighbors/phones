import { GithubOutlined, InboxOutlined, SendOutlined, FileTextFilled, LogoutOutlined } from "@ant-design/icons"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const NavItem = ({ className, children, onClick = () => {} }) => (
  <span
    onClick={onClick}
    className={`h-14 flex flex-col justify-center items-center px-4 hover:bg-violet-700 hover:cursor-pointer ${className}`}
  >
    {children}
  </span>
)

const NavBar = () => {
  const navigate = useNavigate()

  const navigateToInbox = () => {
    navigate("/")
  }

  const navigateToSend = () => {
    navigate("/send")
  }

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
        </div>
        <div className="flex items-center text-lg">1-800-CALL-CLARKE</div>
      </nav>
    </>
  )
}

const Footer = () => (
  <div className="w-full py-2 text-white flex flex-col items-center text-xs gap-1">
    <span>1-800-CALL-CLARKE</span>
  </div>
)

export const Layout = ({ children }) => (
  <div className="flex flex-col min-h-full bg-gray-200">
    <div className="bg-violet-900 flex justify-center">
      <span className="block h-14 w-full max-w-screen-lg">
        <NavBar />
      </span>
    </div>
    <div className="grow flex justify-center">
      <span className="block bg-gray-50 w-full max-w-screen-lg p-1 sm:p-4">{children}</span>
    </div>
    <div className="bg-violet-900">
      <Footer />
    </div>
  </div>
)

export const LayoutWithoutNavBar = ({ children }) => (
  <div className="flex flex-col h-full">
    <div className="flex h-14">
      <div className="bg-violet-900 grow flex justify-center items-center text-lg text-white">1-800-CALL-CLARKE</div>
    </div>
    <div className="flex grow">
      <div className="bg-gray-200 grow"></div>
      <div className="bg-gray-100 w-full max-w-screen-md pt-2 pb-4 px-4">{children}</div>
      <div className="bg-gray-200 grow"></div>
    </div>
    <div className="bg-violet-900">
      <Footer />
    </div>
  </div>
)
