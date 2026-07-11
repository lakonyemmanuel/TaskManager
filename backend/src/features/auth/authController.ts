import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../../lib/prisma.js";
import { signAccessToken, signRefreshToken } from "../../utils/auth.js";
import { createActivityLog } from "../../utils/activity.js";

export const register = async (req: Request, res: Response) => {
    try {
        const { firstname, lastName, email, password } = req.body;

        if (!firstname || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await prisma.user.findUnique({ where: { id: authUser.id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
