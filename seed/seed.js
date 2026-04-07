// seed/seed.js
import {
  initDb,
  usersDb,
  coursesDb,
  sessionsDb,
  bookingsDb,
} from "../models/_db.js";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { UserModel } from "../models/userModel.js";

const iso = (d) => new Date(d).toISOString();

async function wipeAll() {
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

async function createUsers() {
  // Organiser account — login: organiser@yoga.local / password: organiser123
  const organiser = await UserModel.create({
    name: "Studio Admin",
    email: "organiser@yoga.local",
    password: "organiser123",
    role: "organiser",
  });

  // Student account — login: student@yoga.local / password: student123
  const student = await UserModel.create({
    name: "Hassan Ali",
    email: "student@yoga.local",
    password: "student123",
    role: "student",
  });

  return { organiser, student };
}

async function createWeekendWorkshop() {
  const course = await CourseModel.create({
    title: "Winter Mindfulness Weekend",
    level: "beginner",
    type: "WEEKEND_WORKSHOP",
    allowDropIn: false,
    startDate: "2026-05-10",
    endDate: "2026-05-11",
    location: "Studio 1, 42 Sauchiehall Street, Glasgow",
    price: 120,
    sessionIds: [],
    description:
      "Two days of breath work, posture alignment, and guided meditation. Perfect for those new to yoga and mindfulness.",
  });

  const base = new Date("2026-05-10T09:00:00");
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const start = new Date(base.getTime() + i * 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: course._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 20,
      bookedCount: 0,
    });
    sessions.push(s);
  }
  await CourseModel.update(course._id, {
    sessionIds: sessions.map((s) => s._id),
  });
  return { course, sessions };
}

async function createWeeklyBlock() {
  const course = await CourseModel.create({
    title: "12-Week Vinyasa Flow",
    level: "intermediate",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-05-05",
    endDate: "2026-07-21",
    location: "Studio 2, 42 Sauchiehall Street, Glasgow",
    price: 180,
    sessionIds: [],
    description:
      "A progressive 12-week block building strength, flexibility and flow. Drop-ins welcome for individual sessions.",
  });

  const first = new Date("2026-05-05T18:30:00");
  const sessions = [];
  for (let i = 0; i < 12; i++) {
    const start = new Date(first.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 75 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: course._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 18,
      bookedCount: 0,
    });
    sessions.push(s);
  }
  await CourseModel.update(course._id, {
    sessionIds: sessions.map((s) => s._id),
  });
  return { course, sessions };
}

async function createYinYoga() {
  const course = await CourseModel.create({
    title: "Yin Yoga for Stress Relief",
    level: "beginner",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-05-06",
    endDate: "2026-06-24",
    location: "Studio 1, 42 Sauchiehall Street, Glasgow",
    price: 90,
    sessionIds: [],
    description:
      "Gentle long-hold postures targeting connective tissue. Ideal for stress relief and improving flexibility.",
  });

  const first = new Date("2026-05-06T19:00:00");
  const sessions = [];
  for (let i = 0; i < 8; i++) {
    const start = new Date(first.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: course._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 15,
      bookedCount: 0,
    });
    sessions.push(s);
  }
  await CourseModel.update(course._id, {
    sessionIds: sessions.map((s) => s._id),
  });
  return { course, sessions };
}

async function run() {
  console.log("Initialising DB...");
  await initDb();

  console.log("Wiping existing data...");
  await wipeAll();

  console.log("Creating users...");
  const { organiser, student } = await createUsers();

  console.log("Creating Weekend Workshop...");
  const w = await createWeekendWorkshop();

  console.log("Creating 12-Week Vinyasa Flow...");
  const v = await createWeeklyBlock();

  console.log("Creating Yin Yoga course...");
  const y = await createYinYoga();

  const [users, courses, sessions] = await Promise.all([
    usersDb.count({}),
    coursesDb.count({}),
    sessionsDb.count({}),
  ]);

  console.log("\n✅ Seed complete.");
  console.log(`   Users: ${users} | Courses: ${courses} | Sessions: ${sessions}`);
  console.log("\n🔑 Login credentials:");
  console.log("   Organiser → organiser@yoga.local  / organiser123");
  console.log("   Student   → student@yoga.local    / student123");
}

run().catch((err) => {
  console.error("❌ Seed failed:", err?.stack || err);
  process.exit(1);
});
