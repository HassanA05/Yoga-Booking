// tests/helpers.js
import {
  initDb,
  usersDb,
  coursesDb,
  sessionsDb,
  bookingsDb,
} from "../models/_db.js";
import { UserModel } from "../models/userModel.js";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";

export async function resetDb() {
  await initDb();
  await Promise.all([
    usersDb.remove({}, { multi: true }),
    coursesDb.remove({}, { multi: true }),
    sessionsDb.remove({}, { multi: true }),
    bookingsDb.remove({}, { multi: true }),
  ]);
  await Promise.all([
    usersDb.persistence.compactDatafile(),
    coursesDb.persistence.compactDatafile(),
    sessionsDb.persistence.compactDatafile(),
    bookingsDb.persistence.compactDatafile(),
  ]);
}

export async function seedMinimal() {
  // Create users using createRaw to avoid bcrypt slowdown in tests
  const student = await UserModel.createRaw({
    name: "Test Student",
    email: "student@test.local",
    password: "hashedpassword",
    role: "student",
  });

  const organiser = await UserModel.createRaw({
    name: "Test Organiser",
    email: "organiser@test.local",
    password: "hashedpassword",
    role: "organiser",
  });

  const course = await CourseModel.create({
    title: "Test Course",
    level: "beginner",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-05-05",
    endDate: "2026-07-21",
    location: "Test Studio",
    price: 100,
    instructorId: organiser._id,
    sessionIds: [],
    description: "A test course for automated testing.",
  });

  const s1 = await SessionModel.create({
    courseId: course._id,
    startDateTime: new Date("2026-05-05T18:30:00").toISOString(),
    endDateTime: new Date("2026-05-05T19:45:00").toISOString(),
    capacity: 18,
    bookedCount: 0,
  });

  const s2 = await SessionModel.create({
    courseId: course._id,
    startDateTime: new Date("2026-05-12T18:30:00").toISOString(),
    endDateTime: new Date("2026-05-12T19:45:00").toISOString(),
    capacity: 18,
    bookedCount: 0,
  });

  await CourseModel.update(course._id, { sessionIds: [s1._id, s2._id] });

  return { student, organiser, course, sessions: [s1, s2] };
}
