import { successResponse, errorResponse } from "../utils/responses.mjs";
import { client } from "../config/db.mjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userCollection = client.db("taskDB").collection("users");

export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    return res.status(400).json(errorResponse("Required parameter(s) missing"));
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json(errorResponse("Invalid email format"));
  }

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json(errorResponse("Email already registered"));
    }

    const insertResponse = await userCollection.insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdOn: new Date(),
    });

    console.log("User created:", insertResponse.insertedId);

    return res.status(201).json(successResponse("User created"));
  } catch (err) {
    console.error("signUp error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

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

    // Compare password with hashed password
    const result = await bcrypt.compare(password, existingUser.password);

    if (result) {
      const token = jwt.sign(
        {
          isAdmin: false,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          email: existingUser.email,
        },
        process.env.SECRET,
        { expiresIn: "62h" }
      );

      const isProduction =
        process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

      res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "none",
      });

      return res.status(200).json(successResponse("Login successful"));
    } else {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

export const logout = async (req, res) => {
  try {
    const isProduction =
      process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
      
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });

    return res.status(200).json(successResponse("Logged out successfully"));
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json(errorResponse("Server error during logout"));
  }
};

export const check = async (req, res) => {
  try {
    if (!req.user) {
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
    return res.status(500).json(errorResponse("Server error during auth check"));
  }
};