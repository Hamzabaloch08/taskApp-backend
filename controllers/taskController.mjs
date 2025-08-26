import { successResponse, errorResponse } from "../utils/responses.mjs";
import { client } from "../config/db.mjs";
import { ObjectId } from "mongodb";

const taskCollection = client.db("taskDB").collection("tasks");

// Create a new task
export const createTask = async (req, res) => {
  const { title, description } = req.body;

  if (
    !title ||
    typeof title !== "string" ||
    title.trim() === "" ||
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    return res
      .status(400)
      .json(
        errorResponse(
          "Title and description are required and must be non-empty strings"
        )
      );
  }

  try {
    const insertTask = await taskCollection.insertOne({
      title: title.trim(),
      description: description.trim(),
      email: req.user.email,
      completed: false,
      important: false,
      createdOn: new Date(),
    });

    res
      .status(201)
      .json(successResponse("Task created successfully", insertTask));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Something went wrong while creating task"));
  }
};

// Get all tasks for the user
export const getTasks = async (req, res) => {
  try {
    const tasks = await taskCollection
      .find({ email: req.user.email })
      .sort({ _id: -1 })
      .limit(100)
      .toArray();

    res.status(200).json(successResponse("Tasks fetched successfully", tasks));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to fetch tasks"));
  }
};

// Update a task by ID
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid ID"));
  }

  if (
    !title ||
    typeof title !== "string" ||
    title.trim() === "" ||
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    return res
      .status(400)
      .json(
        errorResponse(
          "Title and description are required and must be non-empty strings"
        )
      );
  }

  try {
    const updateResponse = await taskCollection.updateOne(
      { _id: new ObjectId(id), email: req.user.email },
      { $set: { title: title.trim(), description: description.trim() } }
    );

    if (updateResponse.matchedCount === 0) {
      return res.status(404).json(errorResponse("Task not found"));
    }

    return res.status(200).json(successResponse("Task updated successfully"));
  } catch (err) {
    console.error("updateTask error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

// Delete a task by ID
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid ID"));
  }

  try {
    const deleteResponse = await taskCollection.deleteOne({
      _id: new ObjectId(id),
      email: req.user.email,
    });

    if (deleteResponse.deletedCount === 0) {
      return res.status(404).json(errorResponse("Task not found"));
    }

    return res.status(200).json(successResponse("Task deleted successfully"));
  } catch (err) {
    console.error("deleteTask error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

// Delete all tasks for the user
export const deleteAllTasks = async (req, res) => {
  try {
    const deleteResult = await taskCollection.deleteMany({
      email: req.user.email,
    });

    return res.status(200).json(
      successResponse("All tasks deleted successfully", {
        deletedCount: deleteResult.deletedCount,
      })
    );
  } catch (err) {
    console.error("deleteAllTasks error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};