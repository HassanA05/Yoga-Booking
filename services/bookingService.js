// services/bookingService.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";

const canReserveAll = (sessions) =>
  sessions.every((s) => (s.bookedCount ?? 0) < (s.capacity ?? 0));

export async function bookCourseForUser(userId, courseId) {
  const course = await CourseModel.findById(courseId);
  if (!course) throw new Error("Course not found");

  const sessions = await SessionModel.listByCourse(courseId);
  if (sessions.length === 0) throw new Error("Course has no sessions");

  // Prevent duplicate course bookings
  const existingBookings = await BookingModel.listByUser(userId);
  const alreadyBooked = existingBookings.find(
    (b) => b.courseId === courseId && b.status !== "CANCELLED"
  );
  if (alreadyBooked) {
    const err = new Error("You already have an active booking for this course.");
    err.code = "DUPLICATE_BOOKING";
    throw err;
  }

  let status = "CONFIRMED";
  if (!canReserveAll(sessions)) {
    status = "WAITLISTED";
  } else {
    for (const s of sessions) await SessionModel.incrementBookedCount(s._id, 1);
  }

  return BookingModel.create({
    userId,
    courseId,
    type: "COURSE",
    sessionIds: sessions.map((s) => s._id),
    status,
  });
}

export async function bookSessionForUser(userId, sessionId) {
  const session = await SessionModel.findById(sessionId);
  if (!session) throw new Error("Session not found");

  const course = await CourseModel.findById(session.courseId);
  if (!course) throw new Error("Course not found");

  if (!course.allowDropIn) {
    const err = new Error("Drop-in not allowed for this course");
    err.code = "DROPIN_NOT_ALLOWED";
    throw err;
  }

  // Prevent duplicate session bookings
  const existingBookings = await BookingModel.listByUser(userId);
  const alreadyBooked = existingBookings.find(
    (b) =>
      b.status !== "CANCELLED" &&
      Array.isArray(b.sessionIds) &&
      b.sessionIds.includes(sessionId)
  );
  if (alreadyBooked) {
    const err = new Error("You already have an active booking for this session.");
    err.code = "DUPLICATE_BOOKING";
    throw err;
  }

  let status = "CONFIRMED";
  if ((session.bookedCount ?? 0) >= (session.capacity ?? 0)) {
    status = "WAITLISTED";
  } else {
    await SessionModel.incrementBookedCount(session._id, 1);
  }

  return BookingModel.create({
    userId,
    courseId: course._id,
    type: "SESSION",
    sessionIds: [session._id],
    status,
  });
}
