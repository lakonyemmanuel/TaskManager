import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthTokenPayload = {
  id: string;
  email: string;
  type?: "access" | "refresh";
};

export const signAccessToken = (user: { id: string; email: string }) =>
  jwt.sign({ id: user.id, email: user.email, type: "access" }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);

export const signRefreshToken = (user: { id: string; email: string }) =>
  jwt.sign({ id: user.id, email: user.email, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
