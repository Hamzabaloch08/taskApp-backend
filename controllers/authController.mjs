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

    const newUser = await userCollection.findOne({ email: normalizedEmail });
    return res.status(201).json(successResponse("User created", { newUser }));
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

    const passwordMatch = await bcrypt.compare(password, existingUser.password);

    if (!passwordMatch) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }

    const token = jwt.sign(
      {
        isAdmin: existingUser.isAdmin || false,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      },
      process.env.SECRET,
      { expiresIn: "62h" }
    );

    return res.status(200).json(
      successResponse("Login successful", {
        token,
      })
    );
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

export const check = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1]; // Expect "Bearer token"
    if (!token) {
      return res.status(401).json(errorResponse("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    return res
      .status(200)
      .json(successResponse("Authenticated", { user: decoded }));
  } catch (err) {
    console.error("check error:", err);
    return res.status(401).json(errorResponse("Invalid or expired token"));
  }
};

