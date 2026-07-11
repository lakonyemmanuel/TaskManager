import express from "express";
import { createTask, listTasks, updateTask } from "../controllers/taskController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listTasks);
router.post("/", authenticate, createTask);
router.patch("/:id", authenticate, updateTask);

export default router;
