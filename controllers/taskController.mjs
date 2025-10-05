import { successResponse, errorResponse } from "../utils/responses.mjs";
import { client } from "../config/db.mjs";
import { ObjectId } from "mongodb";

const taskCollection = client.db("taskDB").collection("tasks");

// CREATE TASK
export const createTask = async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res
      .status(400)
      .json(
        errorResponse(
          "Title and description are required and must be non-empty"
        )
      );
  }

  try {
    const newTask = {
      title: title.trim(),
      description: description.trim(),
      email: req.user.email, // JWT from Authorization header
      completed: false,
      important: false,
      createdOn: new Date(),
    };

    const result = await taskCollection.insertOne(newTask);

    const createdTask = { ...newTask, _id: result.insertedId };
    res
      .status(201)
      .json(successResponse("Task created successfully", createdTask));
  } catch (err) {
    console.error("createTask error:", err);
    res
      .status(500)
      .json(errorResponse("Something went wrong while creating task"));
  }
};

// GET TASKS
export const getTasks = async (req, res) => {
  const { important, completed } = req.query;

  const filter = { email: req.user.email };

  if (important !== undefined) {
    filter.important = important === "true";
  }

  if (completed !== undefined) {
    filter.completed = completed === "true";
  }

  try {
    const tasks = await taskCollection
      .find(filter)
      .sort({ _id: -1 })
      .limit(100)
      .toArray();

    res.status(200).json(successResponse("Tasks fetched successfully", tasks));
  } catch (err) {
    console.error("getTasks error:", err);
    res.status(500).json(errorResponse("Failed to fetch tasks"));
  }
};

// UPDATE TASK
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, completed, important } = req.body;

  if (!ObjectId.isValid(id))
    return res.status(400).json(errorResponse("Invalid ID"));

  const updates = {};

  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json(errorResponse("Title cannot be empty"));
    }
    updates.title = title.trim();
  }

  if (description !== undefined) {
    if (!description.trim()) {
      return res.status(400).json(errorResponse("Description cannot be empty"));
    }
    updates.description = description.trim();
  }

  if (completed !== undefined) {
    updates.completed = completed === "true" || completed === true;
  }

  if (important !== undefined) {
    updates.important = important === true || important === true;
  }

  try {
    const updateResult = await taskCollection.updateOne(
      { _id: new ObjectId(id), email: req.user.email },
      { $set: updates }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json(errorResponse("Task not found"));
    }

    res.status(200).json(successResponse("Task updated successfully"));
  } catch (err) {
    console.error("updateTask error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id))
    return res.status(400).json(errorResponse("Invalid ID"));

  try {
    const deleteResult = await taskCollection.deleteOne({
      _id: new ObjectId(id),
      email: req.user.email,
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json(errorResponse("Task not found"));
    }

    res.status(200).json(successResponse("Task deleted successfully"));
  } catch (err) {
    console.error("deleteTask error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

// DELETE ALL TASKS
export const deleteAllTasks = async (req, res) => {
  try {
    const deleteResult = await taskCollection.deleteMany({
      email: req.user.email,
    });
    res.status(200).json(
      successResponse("All tasks deleted successfully", {
        deletedCount: deleteResult.deletedCount,
      })
    );
  } catch (err) {
    console.error("deleteAllTasks error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};