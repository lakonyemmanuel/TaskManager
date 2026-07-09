import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      application: "TaskManager API",
      database: "connected",
      version: "1.0.0"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      database: "failed"
    });
  }
});

export default router;