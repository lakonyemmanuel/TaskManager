import express from "express";
import { createComment, listComments } from "../controllers/commentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:taskId", authenticate, listComments);
router.post("/", authenticate, createComment);

export default router;
