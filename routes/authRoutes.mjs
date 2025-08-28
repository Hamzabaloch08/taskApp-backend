import express from "express";
import {
  signUp,
  login,
  logout,
  check,
} from "../controllers/authController.mjs";
import { verifyToken } from "../middleware/authMiddleware.mjs";

export const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/check", verifyToken, check);
