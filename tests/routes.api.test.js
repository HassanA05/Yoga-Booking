// tests/routes.api.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal } from "./helpers.js";
import { UserModel } from "../models/userModel.js";

describe("JSON API routes", () => {
  let data;
  let apiStudent;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();
    // Separate student per describe block to avoid duplicate booking conflicts
    apiStudent = await UserModel.createRaw({
      name: "API Student",
      email: "api@student.local",
      password: "hashed",
      role: "student",
    });
  });

  // ── Courses ──────────────────────────────────────────────────────────────

  test("GET /api/courses returns array of courses", async () => {
    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body.courses)).toBe(true);
    expect(res.body.courses.some((c) => c.title === "Test Course")).toBe(true);
  });

  test("POST /api/courses creates a new course", async () => {
    const payload = {
      title: "API Created Course",
      level: "advanced",
      type: "WEEKEND_WORKSHOP",
      allowDropIn: false,
      startDate: "2026-06-01",
      endDate: "2026-06-02",
      description: "Created via API in tests.",
      location: "Test Hall",
      price: 50,
    };
    const res = await request(app).post("/api/courses").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.course).toBeDefined();
    expect(res.body.course.title).toBe("API Created Course");
  });

  test("GET /api/courses/:id returns course and sessions", async () => {
    const res = await request(app).get(`/api/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.body.course._id).toBe(data.course._id);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBe(2);
  });

  test("GET /api/courses/:id with invalid id returns 404", async () => {
    const res = await request(app).get("/api/courses/nonexistent-id-xyz");
    expect(res.status).toBe(404);
  });

  // ── Sessions ─────────────────────────────────────────────────────────────

  test("POST /api/sessions creates a session", async () => {
    const payload = {
      courseId: data.course._id,
      startDateTime: new Date("2026-05-19T18:30:00").toISOString(),
      endDateTime: new Date("2026-05-19T19:45:00").toISOString(),
      capacity: 16,
    };
    const res = await request(app).post("/api/sessions").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.session).toBeDefined();
    expect(res.body.session.courseId).toBe(data.course._id);
    expect(res.body.session.bookedCount).toBe(0);
  });

  test("GET /api/sessions/by-course/:courseId returns sessions", async () => {
    const res = await request(app).get(
      `/api/sessions/by-course/${data.course._id}`
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(2);
  });

  // ── Bookings ──────────────────────────────────────────────────────────────

  test("POST /api/bookings/course creates a CONFIRMED or WAITLISTED booking", async () => {
    const res = await request(app).post("/api/bookings/course").send({
      userId: apiStudent._id,
      courseId: data.course._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.type).toBe("COURSE");
    expect(["CONFIRMED", "WAITLISTED"]).toContain(res.body.booking.status);
  });

  test("POST /api/bookings/session creates a SESSION booking for a different student", async () => {
    // Use a fresh student who has no bookings yet
    const freshStudent = await UserModel.createRaw({
      name: "Session Student",
      email: "session@student.local",
      password: "hashed",
      role: "student",
    });
    const res = await request(app).post("/api/bookings/session").send({
      userId: freshStudent._id,
      sessionId: data.sessions[0]._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking.type).toBe("SESSION");
  });

  test("DELETE /api/bookings/:id cancels a booking", async () => {
    const cancelStudent = await UserModel.createRaw({
      name: "Cancel Student",
      email: "cancel@student.local",
      password: "hashed",
      role: "student",
    });
    const create = await request(app).post("/api/bookings/session").send({
      userId: cancelStudent._id,
      sessionId: data.sessions[1]._id,
    });
    expect(create.status).toBe(201);
    const bookingId = create.body.booking._id;

    const del = await request(app).delete(`/api/bookings/${bookingId}`);
    expect(del.status).toBe(200);
    expect(del.body.booking.status).toBe("CANCELLED");
  });

  test("DELETE /api/bookings/:id with bad id returns 404", async () => {
    const res = await request(app).delete("/api/bookings/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("Duplicate booking prevention", () => {
  let data;
  let dupStudent;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();
    dupStudent = await UserModel.createRaw({
      name: "Duplicate Test Student",
      email: "dup@test.local",
      password: "hashed",
      role: "student",
    });
  });

  test("POST /api/bookings/course prevents duplicate course booking", async () => {
    const first = await request(app).post("/api/bookings/course").send({
      userId: dupStudent._id,
      courseId: data.course._id,
    });
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/bookings/course").send({
      userId: dupStudent._id,
      courseId: data.course._id,
    });
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/already have an active booking/i);
  });

  test("POST /api/bookings/session prevents duplicate session booking", async () => {
    const sessionStudent = await UserModel.createRaw({
      name: "Session Dup Student",
      email: "sessdup@test.local",
      password: "hashed",
      role: "student",
    });

    const first = await request(app).post("/api/bookings/session").send({
      userId: sessionStudent._id,
      sessionId: data.sessions[0]._id,
    });
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/bookings/session").send({
      userId: sessionStudent._id,
      sessionId: data.sessions[0]._id,
    });
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/already have an active booking/i);
  });

  test("POST /api/bookings/course allows re-booking after cancellation", async () => {
    const reBookStudent = await UserModel.createRaw({
      name: "Rebook Student",
      email: "rebook@test.local",
      password: "hashed",
      role: "student",
    });

    const first = await request(app).post("/api/bookings/course").send({
      userId: reBookStudent._id,
      courseId: data.course._id,
    });
    expect(first.status).toBe(201);
    const bookingId = first.body.booking._id;

    // Cancel it
    await request(app).delete(`/api/bookings/${bookingId}`);

    // Should now be allowed to book again
    const second = await request(app).post("/api/bookings/course").send({
      userId: reBookStudent._id,
      courseId: data.course._id,
    });
    expect(second.status).toBe(201);
  });
});
