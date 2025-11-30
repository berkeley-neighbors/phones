import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { APIContext, APIInstance } from "@/context/APIContext";
import { ComposerProvider } from "@/context/ComposerProvider";
import { SnackbarProvider } from "@/context/SnackbarContext";
import { NotFoundPage } from "./component/NotFoundPage/NotFoundPage";
import { InboxPage } from "./component/InboxPage/InboxPage";
import { ConversationPage } from "./component/ConversationPage/ConversationPage";
import { SendPage } from "./component/SendPage/SendPage";
import { MessagePage } from "./component/MessagePage/MessagePage";
import { SentPage } from "./component/SentPage/SentPage";
import { StaffPage } from "./component/StaffPage/StaffPage";
import { CallsPage } from "./component/CallsPage/CallsPage";
import { CallDetailsPage } from "./component/CallDetailsPage/CallDetailsPage";
import { PhoneBookPage } from "./component/PhoneBookPage/PhoneBookPage";
import { RunbookPage } from "./component/RunbookPage/RunbookPage";
import { ConfigPage } from "./component/ConfigPage/ConfigPage";
import { ForbiddenErrorPage } from "./component/ForbiddenErrorPage/ForbiddenErrorPage";
import { AuthCallbackPage } from "./component/AuthCallbackPage/AuthCallbackPage";

export const App = () => {
  const [loading, setLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    const fetchSessionToken = async () => {
      try {
        const response = await fetch("/api/session-token");
        if (response.status === 403) {
          setIsForbidden(true);
        }
      } catch (error) {
        console.error("Failed to fetch session token:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return <ForbiddenErrorPage />;
  }

  return (
    <APIContext value={APIInstance}>
      <ComposerProvider>
        <Router>
          <SnackbarProvider>
            <div className="min-h-screen">
              <Routes>
                <Route path="/403" element={<ForbiddenErrorPage />} />
                <Route path="/auth-callback" element={<AuthCallbackPage />} />
                <Route path="/" element={<InboxPage />} />
                <Route path="/message/:messageSid" element={<MessagePage />} />
                <Route path="/sent/:messageSid" element={<SentPage />} />
                <Route path="/conversation/:number" element={<ConversationPage />} />
                <Route path="/send" element={<SendPage />} />
                <Route path="/send/:number" element={<SendPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/calls" element={<CallsPage />} />
                <Route path="/call/:callSid" element={<CallDetailsPage />} />
                <Route path="/phonebook" element={<PhoneBookPage />} />
                <Route path="/runbook" element={<RunbookPage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </SnackbarProvider>
        </Router>
      </ComposerProvider>
    </APIContext>
  );
};
