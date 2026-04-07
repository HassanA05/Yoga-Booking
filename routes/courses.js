// routes/courses.js
import { Router } from "express";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const courses = await CourseModel.list();
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const course = await CourseModel.create(req.body);
    res.status(201).json({ course });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    const sessions = await SessionModel.listByCourse(course._id);
    res.json({ course, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
