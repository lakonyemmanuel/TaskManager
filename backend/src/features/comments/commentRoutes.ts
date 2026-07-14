import express from "express";
import { createComment, listComments } from "./commentController.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { validateBody } from "../../shared/validation.js";
import { createCommentSchema } from "./commentSchemas.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { rateLimit } from "../../middleware/rateLimit.js";

const router = express.Router();
router.use(rateLimit);

router.get("/:taskId", authenticate, asyncHandler(listComments));
router.post("/", authenticate, validateBody(createCommentSchema), asyncHandler(createComment));

export default router;
