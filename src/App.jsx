import React from "react"
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"

import { APIContext } from "@/context/APIContext";
import { ComposerProvider } from "@/context/ComposerProvider"
import { NotFoundPage } from "./component/NotFoundPage/NotFoundPage"
import { InboxPage } from "./component/InboxPage/InboxPage"
import { ConversationPage } from "./component/ConversationPage/ConversationPage"
import { SendPage } from "./component/SendPage/SendPage"
import { MessagePage } from "./component/MessagePage/MessagePage"
import { SentPage } from "./component/SentPage/SentPage"
import { ForbiddenErrorPage } from "./component/ForbiddenErrorPage/ForbiddenErrorPage"
import { AuthCallbackPage } from "./component/AuthCallbackPage/AuthCallbackPage"
import axios from "axios";

const instance = axios.create();

const APPLICATION_ID = import.meta.env.VITE_SYNOLOGY_SSO_APP_ID;
const SSO_URL = import.meta.env.VITE_SYNOLOGY_SSO_URL;

instance.interceptors.response.use(null, function (error) {
    const redirectURI = new URL('/auth-callback', window.location.origin).toString();
    
    if (error.status === 401) {
      const ssoLoginURL = new URL('/webman/sso/SSOOauth.cgi', SSO_URL);
      ssoLoginURL.searchParams.append("app_id", APPLICATION_ID);
      ssoLoginURL.searchParams.append("scope", "user_id");
      ssoLoginURL.searchParams.append("synossoJSSDK", "false");
      ssoLoginURL.searchParams.append("redirect_uri", redirectURI);

      window.location.href = ssoLoginURL.toString();
    }
    
    return Promise.reject(error);
  });

export const App = () => {
  return (
    <APIContext value={instance}>
        <ComposerProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                <Route path="/403" element={<ForbiddenErrorPage />} />
                <Route path="/auth-callback" element={<AuthCallbackPage />} />
                <Route
                  path="/"
                  element={
                    <InboxPage />
                  }
                />
                <Route
                  path="/message/:messageSid"
                  element={
                      <MessagePage />
                  }
                />
                <Route
                  path="/sent/:messageSid"
                  element={
                        <SentPage />
                  }
                />
                <Route
                  path="/conversation/:number"
                  element={
                        <ConversationPage />
                  }
                />
                <Route
                  path="/send"
                  element={
                    <SendPage />
                  }
                />
                <Route
                  path="/send/:number"
                  element={
                        <SendPage />
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Router>
        </ComposerProvider>
      </APIContext>
  )
}
