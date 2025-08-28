import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responses.mjs";

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json(errorResponse("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.user = {
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false,
    };
    next();
  } catch (err) {
    return res.status(401).json(errorResponse("Invalid token"));
  }
};
