import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { client } from "../config/db.mjs";
import { successResponse, errorResponse } from "../utils/responses.mjs";

const userCollection = client.db("taskDB").collection("users");

// Cookie options helper
const getCookieOptions = (req) => {
  const isLocal = req.hostname === "localhost" || req.hostname === "127.0.0.1";

  if (isLocal) {
    return {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  return {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

// 📝 Signup
export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json(errorResponse("All fields required"));
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json(errorResponse("Invalid email"));
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await userCollection.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json(errorResponse("Email already registered"));
    }

    const hashed = await bcrypt.hash(password, 10);

    await userCollection.insertOne({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashed,
      createdOn: new Date(),
    });

    return res.status(201).json(successResponse("User created"));
  } catch (err) {
    console.error("signUp error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

// 🔑 Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(errorResponse("Email and password required"));
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userCollection.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json(errorResponse("Invalid email or password"));
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json(errorResponse("Invalid email or password"));
    }

    const token = jwt.sign(
      {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      process.env.SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, getCookieOptions(req));

    return res.status(200).json(successResponse("Login successful"));
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

// 🚪 Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", getCookieOptions(req));
    return res.status(200).json(successResponse("Logged out successfully"));
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json(errorResponse("Logout failed"));
  }
};

// ✅ Check
export const check = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(errorResponse("Not authenticated"));
    }

    return res.status(200).json(
      successResponse("Authenticated", {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
      })
    );
  } catch (err) {
    console.error("check error:", err);
    res.status(500).json(errorResponse("Auth check failed"));
  }
};
