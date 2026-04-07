// controllers/organiserController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { UserModel } from "../models/userModel.js";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// ── Dashboard ──────────────────────────────────────────────────────────────

export const dashboard = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const users = await UserModel.list();
    res.render("organiser/dashboard", {
      title: "Organiser Dashboard",
      courseCount: courses.length,
      userCount: users.length,
    });
  } catch (err) {
    next(err);
  }
};

// ── Courses ────────────────────────────────────────────────────────────────

export const listCourses = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const enriched = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          sessionsCount: sessions.length,
          hasNoSessions: sessions.length === 0,
          startDate: c.startDate || "",
          endDate: c.endDate || "",
        };
      })
    );
    res.render("organiser/courses", {
      title: "Manage Courses",
      courses: enriched,
      hasCourses: enriched.length > 0,
    });
  } catch (err) {
    next(err);
  }
};

export const getAddCourse = (req, res) => {
  res.render("organiser/course_form", {
    title: "Add New Course",
    course: {},
    action: "/organiser/courses",
    buttonLabel: "Create Course",
    
  });
};

export const postAddCourse = async (req, res, next) => {
  try {
    const { title, level, type, allowDropIn, startDate, endDate, description, location, price } = req.body;
    if (!title || !level || !type) {
      req.session.flash = { error: "Title, level, and type are required." };
      return res.redirect("/organiser/courses/add");
    }
    await CourseModel.create({
      title: title.trim(),
      level,
      type,
      allowDropIn: allowDropIn === "on" || allowDropIn === "true",
      startDate: startDate || null,
      endDate: endDate || null,
      description: description?.trim() || "",
      location: location?.trim() || "",
      price: price ? parseFloat(price) : null,
      sessionIds: [],
    });
    req.session.flash = { success: "Course created successfully." };
    return res.redirect("/organiser/courses");
  } catch (err) {
    next(err);
  }
};

export const getEditCourse = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render("error", { title: "Not Found", message: "Course not found." });
    res.render("organiser/course_form", {
      title: "Edit Course",
      course: {
        ...course,
        id: course._id,
        isLevelBeginner: course.level === "beginner",
        isLevelIntermediate: course.level === "intermediate",
        isLevelAdvanced: course.level === "advanced",
        isTypeWeekly: course.type === "WEEKLY_BLOCK",
        isTypeWeekend: course.type === "WEEKEND_WORKSHOP",
      },
      action: `/organiser/courses/${course._id}/edit`,
      buttonLabel: "Save Changes",
    });
  } catch (err) {
    next(err);
  }
};

export const postEditCourse = async (req, res, next) => {
  try {
    const { title, level, type, allowDropIn, startDate, endDate, description, location, price } = req.body;
    if (!title || !level || !type) {
      req.session.flash = { error: "Title, level, and type are required." };
      return res.redirect(`/organiser/courses/${req.params.id}/edit`);
    }
    await CourseModel.update(req.params.id, {
      title: title.trim(),
      level,
      type,
      allowDropIn: allowDropIn === "on" || allowDropIn === "true",
      startDate: startDate || null,
      endDate: endDate || null,
      description: description?.trim() || "",
      location: location?.trim() || "",
      price: price ? parseFloat(price) : null,
    });
    req.session.flash = { success: "Course updated successfully." };
    return res.redirect("/organiser/courses");
  } catch (err) {
    next(err);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    await SessionModel.deleteByCourse(courseId);
    await BookingModel.deleteByCourse(courseId);
    await CourseModel.delete(courseId);
    req.session.flash = { success: "Course deleted." };
    return res.redirect("/organiser/courses");
  } catch (err) {
    next(err);
  }
};

// ── Sessions ───────────────────────────────────────────────────────────────

export const listSessions = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId);
    if (!course) return res.status(404).render("error", { title: "Not Found", message: "Course not found." });
    const sessions = await SessionModel.listByCourse(course._id);
    const rows = sessions.map((s) => ({
      id: s._id,
      start: fmtDate(s.startDateTime),
      end: fmtDate(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
    }));
    res.render("organiser/sessions", {
      title: `Sessions: ${course.title}`,
      course: { id: course._id, title: course.title },
      sessions: rows,
    });
  } catch (err) {
    next(err);
  }
};

export const getAddSession = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId);
    if (!course) return res.status(404).render("error", { title: "Not Found", message: "Course not found." });
    res.render("organiser/session_form", {
      title: "Add Session",
      course: { id: course._id, title: course.title },
      session: {},
      action: `/organiser/courses/${course._id}/sessions/add`,
      buttonLabel: "Add Session",
    });
  } catch (err) {
    next(err);
  }
};

export const postAddSession = async (req, res, next) => {
  try {
    const { startDateTime, endDateTime, capacity } = req.body;
    if (!startDateTime || !endDateTime || !capacity) {
      req.session.flash = { error: "All session fields are required." };
      return res.redirect(`/organiser/courses/${req.params.courseId}/sessions/add`);
    }
    const session = await SessionModel.create({
      courseId: req.params.courseId,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      capacity: parseInt(capacity, 10),
      bookedCount: 0,
    });
    const course = await CourseModel.findById(req.params.courseId);
    const ids = [...(course.sessionIds || []), session._id];
    await CourseModel.update(req.params.courseId, { sessionIds: ids });
    req.session.flash = { success: "Session added." };
    return res.redirect(`/organiser/courses/${req.params.courseId}/sessions`);
  } catch (err) {
    next(err);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.params;
    await SessionModel.delete(sessionId);
    const course = await CourseModel.findById(courseId);
    if (course) {
      const ids = (course.sessionIds || []).filter((id) => id !== sessionId);
      await CourseModel.update(courseId, { sessionIds: ids });
    }
    req.session.flash = { success: "Session deleted." };
    return res.redirect(`/organiser/courses/${courseId}/sessions`);
  } catch (err) {
    next(err);
  }
};

// ── Class List ─────────────────────────────────────────────────────────────

export const classListPage = async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.params;
    const course = await CourseModel.findById(courseId);
    if (!course) return res.status(404).render("error", { title: "Not Found", message: "Course not found." });

    const sessions = await SessionModel.listByCourse(courseId);

    let targetSessionId = sessionId;
    let selectedSession = null;

    if (targetSessionId) {
      selectedSession = sessions.find((s) => s._id === targetSessionId);
    }

    // Get all bookings for this course
    const bookings = await BookingModel.listByCourse(courseId);
    const confirmedBookings = bookings.filter((b) => b.status !== "CANCELLED");

    // Enrich with user details
    const participants = await Promise.all(
      confirmedBookings.map(async (b) => {
        const user = await UserModel.findById(b.userId);
        return {
          name: user ? user.name : "Unknown",
          email: user ? user.email : "Unknown",
          bookingType: b.type,
          status: b.status,
          bookedAt: fmtDate(b.createdAt),
          // If filtering by session, only include bookings that include this session
          includesSession: !targetSessionId || b.sessionIds.includes(targetSessionId),
        };
      })
    );

    const filtered = targetSessionId
      ? participants.filter((p) => p.includesSession)
      : participants;

    res.render("organiser/class_list", {
      title: `Class List: ${course.title}`,
      course: { id: course._id, title: course.title },
      sessions: sessions.map((s) => ({
        id: s._id,
        label: fmtDate(s.startDateTime),
        selected: s._id === targetSessionId,
      })),
      selectedSession: selectedSession ? fmtDate(selectedSession.startDateTime) : null,
      participants: filtered,
      total: filtered.length,
    });
  } catch (err) {
    next(err);
  }
};

// ── Users ──────────────────────────────────────────────────────────────────

export const listUsers = async (req, res, next) => {
  try {
    const users = await UserModel.list();
    res.render("organiser/users", {
      title: "Manage Users",
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isOrganiser: u.role === "organiser",
      })),
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id) {
      req.session.flash = { error: "You cannot delete your own account." };
      return res.redirect("/organiser/users");
    }
    await UserModel.delete(req.params.id);
    req.session.flash = { success: "User removed." };
    return res.redirect("/organiser/users");
  } catch (err) {
    next(err);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["student", "organiser"].includes(role)) {
      req.session.flash = { error: "Invalid role." };
      return res.redirect("/organiser/users");
    }
    await UserModel.updateRole(req.params.id, role);
    req.session.flash = { success: "User role updated." };
    return res.redirect("/organiser/users");
  } catch (err) {
    next(err);
  }
};

export const bookingController = {
  async cancelBooking(req, res, next) {
    try {
      const { bookingId } = req.params;
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      if (booking.status === "CANCELLED") return res.json({ booking });
      if (booking.status === "CONFIRMED") {
        for (const sid of booking.sessionIds) {
          await SessionModel.incrementBookedCount(sid, -1);
        }
      }
      const updated = await BookingModel.cancel(bookingId);
      res.json({ booking: updated });
    } catch (err) {
      next(err);
    }
  },
};

// ── Edit Session ───────────────────────────────────────────────────────────

export const getEditSession = async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.params;
    const course = await CourseModel.findById(courseId);
    const session = await SessionModel.findById(sessionId);
    if (!course || !session)
      return res.status(404).render("error", { title: "Not Found", message: "Session not found." });

    const fmt = (iso) => iso ? iso.slice(0, 16) : "";
    res.render("organiser/session_form", {
      title: "Edit Session",
      course: { id: course._id, title: course.title },
      session: {
        startDateTime: fmt(session.startDateTime),
        endDateTime: fmt(session.endDateTime),
        capacity: session.capacity,
      },
      action: `/organiser/courses/${courseId}/sessions/${sessionId}/edit`,
      buttonLabel: "Save Changes",
    });
  } catch (err) {
    next(err);
  }
};

export const postEditSession = async (req, res, next) => {
  try {
    const { courseId, sessionId } = req.params;
    const { startDateTime, endDateTime, capacity } = req.body;
    if (!startDateTime || !endDateTime || !capacity) {
      req.session.flash = { error: "All session fields are required." };
      return res.redirect(`/organiser/courses/${courseId}/sessions/${sessionId}/edit`);
    }
    await SessionModel.update(sessionId, {
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      capacity: parseInt(capacity, 10),
    });
    req.session.flash = { success: "Session updated." };
    return res.redirect(`/organiser/courses/${courseId}/sessions`);
  } catch (err) {
    next(err);
  }
};
