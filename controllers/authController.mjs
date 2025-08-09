import { successResponse, errorResponse } from "../utils/responses.mjs";
import { client } from "../config/db.mjs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userCollection = client.db("todoDB").collection("users");

export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    return res.status(400).json(errorResponse("Required parameter(s) missing"));
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
    } else {
      const insertResponse = await userCollection.insertOne({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        createdOn: new Date(),
      });

      console.log("response", insertResponse);

      res.status(201).json(successResponse("User created"));
    }
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

      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
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
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "strict",
    });
    return res.status(200).json(successResponse("Logged out successfully"));
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json(errorResponse("Server error during logout"));
  }
};