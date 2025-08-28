import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";

import { errorResponse } from "./utils/responses.mjs";
import { taskRoutes } from "./routes/taskRoutes.mjs";
import { authRoutes } from "./routes/authRoutes.mjs";

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Auth routes (signup, login, logout, check)
app.use("/api/v1/auth", authRoutes);


app.use((req, res, next) => {
  // Paths that do NOT require auth
  const publicPaths = [
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/logout",
    "/api/v1/auth/check",
  ];

  if (
    req.path.startsWith("/api/v1/auth") &&
    publicPaths.some((p) => req.path.endsWith(p))
  ) {
    return next();
  }

  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json(errorResponse("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = {
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };
    next();
  } catch (err) {
    return res.status(401).json(errorResponse("Invalid token"));
  }
});

// Task routes (protected)
app.use("/api/v1/tasks", taskRoutes);

// Server start (local)
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
