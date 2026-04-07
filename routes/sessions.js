// routes/sessions.js
import { Router } from "express";
import { SessionModel } from "../models/sessionModel.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const session = await SessionModel.create({ ...req.body, bookedCount: 0 });
    res.status(201).json({ session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/by-course/:courseId", async (req, res) => {
  try {
    const sessions = await SessionModel.listByCourse(req.params.courseId);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
