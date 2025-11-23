import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

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
import { ForbiddenErrorPage } from "./component/ForbiddenErrorPage/ForbiddenErrorPage";
import { AuthCallbackPage } from "./component/AuthCallbackPage/AuthCallbackPage";

export const App = () => {
  useEffect(() => {
    const token = fetch("/api/session-token");
  }, []);

  return (
    <APIContext value={APIInstance}>
      <SnackbarProvider>
        <ComposerProvider>
          <Router>
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
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Router>
        </ComposerProvider>
      </SnackbarProvider>
    </APIContext>
  );
};
