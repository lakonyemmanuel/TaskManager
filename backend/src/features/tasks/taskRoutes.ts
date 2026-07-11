import express from "express";
import { createTask, deleteTask, listTasks, updateTask } from "./taskController.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listTasks);
router.post("/", authenticate, createTask);
router.patch("/:id", authenticate, updateTask);
router.delete("/:id", authenticate, deleteTask);

export default router;
