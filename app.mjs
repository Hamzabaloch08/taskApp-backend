// server.mjs
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import { taskRoutes } from "./routes/taskRoutes.mjs";
import { authRoutes } from "./routes/authRoutes.mjs";
import { errorResponse } from "./utils/responses.mjs";

dotenv.config();
const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true, // important for sending cookies cross-origin
  })
);
app.use("/api/v1/auth", authRoutes);

// Auth middleware
app.use((req, res, next) => {
  const publicPaths = ["/api/v1/auth/signup", "/api/v1/auth/login", "/api/v1/auth/logout"];
  if (publicPaths.includes(req.path)) return next();

  const token = req.cookies.token;
  if (!token) return res.status(401).json(errorResponse("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json(errorResponse("Invalid token"));
  }
});

// Routes
app.use("/api/v1", taskRoutes);

// Dev server
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server is running on port ${port}`));
}

// Export for Vercel
export default app;