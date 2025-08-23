import { createContext } from "react";
import axios from "axios";

const instance = axios.create();

const APPLICATION_ID = import.meta.env.VITE_SYNOLOGY_SSO_APP_ID;
const SSO_URL = import.meta.env.VITE_SYNOLOGY_SSO_URL;

instance.interceptors.response.use(null, function (error) {
  const redirectURI = new URL("/auth-callback", window.location.origin).toString();

  if (error.status === 401) {
    const ssoLoginURL = new URL("/webman/sso/SSOOauth.cgi", SSO_URL);
    ssoLoginURL.searchParams.append("app_id", APPLICATION_ID);
    ssoLoginURL.searchParams.append("scope", "user_id");
    ssoLoginURL.searchParams.append("synossoJSSDK", "false");
    ssoLoginURL.searchParams.append("redirect_uri", redirectURI);

    window.location.href = ssoLoginURL.toString();
  }

  return Promise.reject(error);
});

export const APIContext = createContext(null);
export const APIInstance = instance;
