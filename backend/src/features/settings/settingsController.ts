import { Request, Response } from "express";
import prisma from "../../lib/prisma.js";

export const getSettings = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                firstname: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                bio: true,
                language: true,
                fontStyle: true,
                colorTheme: true,
            },
        });

        return res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const authUser = (req as Request & { user?: { id: string; email: string } }).user;
        if (!authUser) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { firstname, lastName, avatarUrl, bio, language, fontStyle, colorTheme } = req.body;

        const data: Record<string, unknown> = {};
        if (firstname !== undefined) data.firstname = firstname;
        if (lastName !== undefined) data.lastName = lastName;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
        if (bio !== undefined) data.bio = bio;
        if (language !== undefined) data.language = language;
        if (fontStyle !== undefined) data.fontStyle = fontStyle;
        if (colorTheme !== undefined) data.colorTheme = colorTheme;

        const user = await prisma.user.update({
            where: { id: authUser.id },
            data,
            select: {
                id: true,
                firstname: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                bio: true,
                language: true,
                fontStyle: true,
                colorTheme: true,
            },
        });

        return res.status(200).json({ message: "Profile updated", user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
