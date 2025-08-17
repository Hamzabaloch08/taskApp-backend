import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  deleteAllTasks,
} from "../controllers/taskController.mjs";

export const taskRoutes = express.Router();

taskRoutes.get("/tasks", getTasks);
taskRoutes.post("/tasks", createTask);
taskRoutes.put("/tasks/:id", updateTask);
taskRoutes.delete("/tasks/:id", deleteTask);
taskRoutes.delete("/tasks", deleteAllTasks);