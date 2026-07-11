import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

export type AuthTokenPayload = {
    id: string;
    email: string;
    type?: "access" | "refresh";
};

export const signAccessToken = (user: { id: string; email: string }) =>
    jwt.sign({ id: user.id, email: user.email, type: "access" }, JWT_SECRET, {
        expiresIn: "15m",
    });

export const signRefreshToken = (user: { id: string; email: string }) =>
    jwt.sign({ id: user.id, email: user.email, type: "refresh" }, JWT_SECRET, {
        expiresIn: "7d",
    });

export const verifyToken = (token: string) =>
    jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
