import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { authRoutes } from "./routes/authRoutes.mjs";
import { taskRoutes } from "./routes/taskRoutes.mjs";
import { errorResponse } from "./utils/responses.mjs";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://fullstack-task-app-three.vercel.app",
];

// Middleware
app.use(express.json());

// app.use(cors({
//   origin: function(origin, callback){
//     if(!origin) return callback(null, true); // allow non-browser requests
//     if(allowedOrigins.indexOf(origin) === -1){
//       return callback(new Error("CORS not allowed"), false);
//     }
//     return callback(null, true);
//   },
//   methods: ["GET","POST","PUT","DELETE","OPTIONS"],
//   allowedHeaders: ["Content-Type","Authorization"],
// }));

app.use((req, res, next) => {
  const publicPaths = [
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/check",
  ];

  if (publicPaths.includes(req.path)) return next();

  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Expect: "Bearer <token>"

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
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(errorResponse("Route not found"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json(errorResponse("Internal server error"));
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
