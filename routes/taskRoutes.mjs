import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  deleteAllTasks,
} from "../controllers/taskController.mjs";

const router = express.Router();

router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.delete("/tasks", deleteAllTasks);

export { router as taskRoutes };
