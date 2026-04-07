// routes/views.js
import { Router } from "express";
import {
  homePage,
  courseDetailPage,
  postBookCourse,
  postBookSession,
  bookingConfirmationPage,
  myBookingsPage,
} from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";
import { requireLogin } from "../middlewares/auth.js";

const router = Router();

router.get("/", homePage);
router.get("/courses", coursesListPage);
router.get("/courses/:id", courseDetailPage);

// Protected — must be logged in to book
router.post("/courses/:id/book", requireLogin, postBookCourse);
router.post("/sessions/:id/book", requireLogin, postBookSession);
router.get("/bookings/:bookingId", requireLogin, bookingConfirmationPage);
router.get("/my-bookings", requireLogin, myBookingsPage);

export default router;
