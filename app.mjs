import { errorResponse } from "./utils/responses.mjs";
import { taskRoutes } from "./routes/taskRoutes.mjs";
import { authRoutes } from "./routes/authRoutes.mjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cookieParser());

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);



app.use("/api/v1/auth", authRoutes);

app.use((req, res, next) => {
  const publicPaths = ["/signup", "/login", "/logout"];

  if (publicPaths.includes(req.path)) {
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

app.use("/api/v1", taskRoutes);

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export for Vercel
export default app;
