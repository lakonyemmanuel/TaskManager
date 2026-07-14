import express from "express";
import { createTask, deleteTask, listTasks, updateTask } from "./taskController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { validateBody } from "../../shared/validation.js";
import { createTaskSchema, updateTaskSchema } from "./taskSchemas.js";
import { asyncHandler } from "../../shared/asyncHandler.js";

const router = express.Router();

router.get("/", authenticate, asyncHandler(listTasks));
router.post("/", authenticate, validateBody(createTaskSchema), asyncHandler(createTask));
router.patch("/:id", authenticate, validateBody(updateTaskSchema), asyncHandler(updateTask));
router.delete("/:id", authenticate, asyncHandler(deleteTask));

export default router;
