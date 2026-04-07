// controllers/bookingController.js
import { bookCourseForUser, bookSessionForUser } from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";
import { SessionModel } from "../models/sessionModel.js";

const USER_ERROR_CODES = ["DROPIN_NOT_ALLOWED", "DUPLICATE_BOOKING"];

export const bookCourse = async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    const booking = await bookCourseForUser(userId, courseId);
    res.status(201).json({ booking });
  } catch (err) {
    const status = USER_ERROR_CODES.includes(err.code) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const bookSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    const booking = await bookSessionForUser(userId, sessionId);
    res.status(201).json({ booking });
  } catch (err) {
    const status = USER_ERROR_CODES.includes(err.code) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const cancelBooking = async (req, res) => {
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
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};
