// controllers/viewsController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { bookCourseForUser, bookSessionForUser } from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        weekday: "short", year: "numeric", month: "short",
        day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "TBA";

const fmtDateOnly = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "";

export const homePage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const cards = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const nextSession = sessions[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          startDate: fmtDateOnly(c.startDate),
          endDate: fmtDateOnly(c.endDate),
          nextSession: nextSession ? fmtDate(nextSession.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
          location: c.location || "Yoga Studio, Glasgow",
          price: c.price ? `£${c.price}` : "Contact for pricing",
        };
      })
    );
    res.render("home", { title: "Yoga & Mindfulness Studio", courses: cards });
  } catch (err) {
    next(err);
  }
};

export const courseDetailPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res.status(404).render("error", { title: "Not Found", message: "Course not found." });

    const sessions = await SessionModel.listByCourse(courseId);
    const rows = sessions.map((s) => ({
      id: s._id,
      start: fmtDate(s.startDateTime),
      end: fmtDate(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
      remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
      isFull: (s.bookedCount ?? 0) >= (s.capacity ?? 0),
      // Passed onto each row so Mustache can read without parent-context traversal
      // ({{../}} is Handlebars syntax, not standard Mustache)
      allowDropIn: course.allowDropIn,
      user: req.user ? { _id: req.user._id } : null,
    }));

    res.render("course", {
      title: course.title,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        startDate: fmtDateOnly(course.startDate),
        endDate: fmtDateOnly(course.endDate),
        description: course.description,
        location: course.location || "Yoga Studio, Glasgow",
        price: course.price ? `£${course.price}` : "Contact for pricing",
      },
      sessions: rows,
    });
  } catch (err) {
    next(err);
  }
};

export const postBookCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const booking = await bookCourseForUser(req.user._id, courseId);
    return res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    if (err.code === "DUPLICATE_BOOKING") {
      req.session.flash = { error: err.message };
      return res.redirect(`/courses/${req.params.id}`);
    }
    res.status(400).render("error", { title: "Booking Failed", message: err.message });
  }
};

export const postBookSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const booking = await bookSessionForUser(req.user._id, sessionId);
    return res.redirect(`/bookings/${booking._id}`);
  } catch (err) {
    if (err.code === "DUPLICATE_BOOKING") {
      const session = await SessionModel.findById(req.params.id).catch(() => null);
      const courseId = session ? session.courseId : "";
      req.session.flash = { error: err.message };
      return res.redirect(courseId ? `/courses/${courseId}` : "/courses");
    }
    const message =
      err.code === "DROPIN_NOT_ALLOWED"
        ? "Drop-ins are not allowed for this course."
        : err.message;
    res.status(400).render("error", { title: "Booking Failed", message });
  }
};

export const bookingConfirmationPage = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await BookingModel.findById(bookingId);
    if (!booking)
      return res.status(404).render("error", { title: "Not Found", message: "Booking not found." });

    const course = await CourseModel.findById(booking.courseId);

    res.render("booking_confirmation", {
      title: "Booking Confirmed",
      booking: {
        id: booking._id,
        type: booking.type,
        status: booking.status,
        createdAt: fmtDate(booking.createdAt),
        courseTitle: course ? course.title : "Unknown Course",
        courseId: booking.courseId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const myBookingsPage = async (req, res, next) => {
  try {
    const bookings = await BookingModel.listByUser(req.user._id);
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const course = await CourseModel.findById(b.courseId);
        return {
          id: b._id,
          type: b.type,
          status: b.status,
          createdAt: fmtDate(b.createdAt),
          courseTitle: course ? course.title : "Unknown Course",
          courseId: b.courseId,
        };
      })
    );
    res.render("my_bookings", { title: "My Bookings", bookings: enriched });
  } catch (err) {
    next(err);
  }
};
