import express from "express";
import { signUp, login, logout, check } from "../controllers/authController.mjs";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check", check);

export { router as authRoutes };
