import { errorResponse } from "./utils/responses.mjs";
import { todoRoutes } from "./routes/todoRoutes.mjs";
import { authRoutes } from "./routes/authRoutes.mjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";

const PORT = process.env.PORT || 4000;
const app = express();
dotenv.config();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", authRoutes);

app.use((req, res, next) => {
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

app.use("/api/v1", todoRoutes);


app.listen(PORT, () => {
  console.log(`example server listining on PORT ${PORT}`);
});
