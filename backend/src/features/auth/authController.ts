import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/auth.js";
import { createActivityLog } from "../../utils/activity.js";
import { HttpError } from "../../shared/httpError.js";

export const register = async (req: Request, res: Response) => {
  const { firstname, lastName, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new HttpError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      firstname,
      lastName,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email });

  await createActivityLog({ userId: user.id, action: "Registered account" });

  return res.status(201).json({
    message: "User registered successfully",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastName: user.lastName,
      email: user.email,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new HttpError(401, "Invalid credentials");
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email });

  await createActivityLog({ userId: user.id, action: "Logged in" });

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastName: user.lastName,
      email: user.email,
    },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const payload = verifyToken(refreshToken) as { id: string; email: string; type?: string };

  if (payload.type !== "refresh") {
    throw new HttpError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    throw new HttpError(401, "Invalid refresh token");
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  return res.status(200).json({ accessToken });
};

export const me = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: { id: string; email: string } }).user;
  if (!authUser) {
    throw new HttpError(401, "Authentication required");
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return res.status(200).json({
    user: {
      id: user.id,
      firstname: user.firstname,
      lastName: user.lastName,
      email: user.email,
    },
  });
};
