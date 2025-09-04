import { successResponse, errorResponse } from "../utils/responses.mjs";
import { client } from "../config/db.mjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userCollection = client.db("taskDB").collection("users");

// 🔐 Helper for cookie options
const getCookieOptions = (req) => {
  const isLocalhost =
    req.hostname === "localhost" || req.hostname === "127.0.0.1";

  const isProduction =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

  if (isLocalhost) {
    // Local frontend + backend (http://localhost)
    return {
      httpOnly: true,
      secure: false, // ❌ not https in local
      sameSite: "lax", // ✅ lax works with http
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  if (isProduction) {
    // Deployed (vercel + frontend also on https://...)
    return {
      httpOnly: true,
      secure: true, // ✅ must be true for https
      sameSite: "none", // ✅ allows cross-site cookies
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  // fallback
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

// 📝 Signup
export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    return res.status(400).json(errorResponse("Required parameter(s) missing"));
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json(errorResponse("Invalid email format"));
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json(errorResponse("Email already registered"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userCollection.insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdOn: new Date(),
    });

    return res.status(201).json(successResponse("User created"));
  } catch (err) {
    console.error("signUp error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

// 🔑 Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json(errorResponse("Required parameter(s) missing"));
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existingUser = await userCollection.findOne({
      email: normalizedEmail,
    });

    if (!existingUser) {
      return res
        .status(404)
        .json(errorResponse("Email or password is incorrect"));
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);

    if (!passwordMatch) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }

    const token = jwt.sign(
      {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        email: existingUser.email,
        isAdmin: existingUser.isAdmin || false,
      },
      process.env.SECRET,
      { expiresIn: "62h" }
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
    return res.status(500).json(errorResponse("Server error during logout"));
  }
};

// ✅ Auth Check
export const check = async (req, res) => {
  try {
    if (!req?.user) {
      return res.status(401).json(errorResponse("Not authenticated"));
    }

    return res.status(200).json(
      successResponse("User is authenticated", {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
      })
    );
  } catch (err) {
    console.error("check error:", err);
    return res
      .status(500)
      .json(errorResponse("Server error during auth check"));
  }
};
