// routes/organiser.js
import { Router } from "express";
import { requireOrganiser } from "../middlewares/auth.js";
import {
  dashboard,
  listCourses,
  getAddCourse,
  postAddCourse,
  getEditCourse,
  postEditCourse,
  deleteCourse,
  listSessions,
  getAddSession,
  postAddSession,
  getEditSession,
  postEditSession,
  deleteSession,
  classListPage,
  listUsers,
  deleteUser,
  updateUserRole,
} from "../controllers/organiserController.js";

const router = Router();

// All organiser routes require organiser role
router.use(requireOrganiser);

// Dashboard
router.get("/", dashboard);

// Courses
router.get("/courses", listCourses);
router.get("/courses/add", getAddCourse);
router.post("/courses", postAddCourse);
router.get("/courses/:id/edit", getEditCourse);
router.post("/courses/:id/edit", postEditCourse);
router.post("/courses/:id/delete", deleteCourse);

// Sessions within a course
router.get("/courses/:courseId/sessions", listSessions);
router.get("/courses/:courseId/sessions/add", getAddSession);
router.post("/courses/:courseId/sessions/add", postAddSession);
router.get("/courses/:courseId/sessions/:sessionId/edit", getEditSession);
router.post("/courses/:courseId/sessions/:sessionId/edit", postEditSession);
router.post("/courses/:courseId/sessions/:sessionId/delete", deleteSession);

// Class list
router.get("/courses/:courseId/class-list", classListPage);
router.get("/courses/:courseId/class-list/:sessionId", classListPage);

// Users
router.get("/users", listUsers);
router.post("/users/:id/delete", deleteUser);
router.post("/users/:id/role", updateUserRole);

export default router;
