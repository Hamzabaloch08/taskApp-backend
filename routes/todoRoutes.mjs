import express from "express";
import {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
  deleteAllTodos,
} from "../controllers/todoController.mjs";

export const todoRoutes = express.Router();

todoRoutes.get("/todos", getTodos);
todoRoutes.post("/todos", createTodo);
todoRoutes.put("/todos/:id", updateTodo);
todoRoutes.delete("/todos/:id", deleteTodo);
todoRoutes.delete("/todos", deleteAllTodos);