import express from "express";
import cookieParser from "cookie-parser";

export function setMiddleware(app, COOKIE_SECRET) {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser(COOKIE_SECRET));
}
