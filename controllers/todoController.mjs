import { successResponse, errorResponse } from "../utils/responses.mjs";
import { client } from "../config/db.mjs";
import { ObjectId } from "mongodb";

const todoCollection = client.db("todoDB").collection("tasks");

export const createTodo = async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res
      .status(400)
      .json(errorResponse("Title is required and must be a non-empty string"));
  }

  try {
    const insertTask = await todoCollection.insertOne({
      title,
      email: req.user.email,
    });

    res
      .status(201)
      .json(successResponse("Todo created successfully", insertTask));
  } catch (err) {
    res
      .status(500)
      .json(errorResponse("Something went wrong while creating todo"));
  }
};

export const getTodos = async (req, res) => {
  try {
    const cursor = todoCollection
      .find({ email: req.user.email })
      .sort({ _id: -1 })
      .limit(100);

    const todos = await cursor.toArray();
    res.status(200).json(successResponse("Todo fetched successfully", todos));
  } catch (err) {
    res.status(500).json(errorResponse("Failed to fetch todos"));
  }
};

export const updateTodo = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (
    !id ||
    !req.body ||
    typeof req.body !== "object" ||
    (title !== undefined && (typeof title !== "string" || !title.trim()))
  ) {
    return res.status(400).json(errorResponse("Invalid input"));
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid ID"));
  }

  const updateFields = {};
  if (title !== undefined) updateFields.title = title.trim();
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json(errorResponse("Nothing to update"));
  }

  try {
    const insertResponse = await todoCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (insertResponse.matchedCount === 0) {
      return res.status(404).json(errorResponse("Todo not found"));
    }

    return res.status(200).json(successResponse("Todo updated successfully"));
  } catch (err) {
    console.error("updateTodo error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

export const deleteTodo = async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId
  if (!ObjectId.isValid(id)) {
    return res.status(400).json(errorResponse("Invalid ID"));
  }

  try {
    const deleteResponse = await todoCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResponse.deletedCount === 0) {
      return res.status(404).json(errorResponse("Todo not found"));
    }

    return res.status(200).json(successResponse("Todo deleted successfully"));
  } catch (err) {
    console.error("deleteTodo error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

export const deleteAllTodos = async (req, res) => {
  try {
    const deleteResult = await todoCollection.deleteMany({});

    return res.status(200).json(
      successResponse("All todos deleted successfully", {
        deletedCount: deleteResult.deletedCount,
      })
    );
  } catch (err) {
    console.error("deleteAllTodos error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};
