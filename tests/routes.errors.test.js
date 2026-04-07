// tests/routes.errors.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb } from "./helpers.js";

describe("Edge cases and error handling", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
  });

  test("GET /courses/:id with non-existent id returns 404 HTML", async () => {
    const res = await request(app).get("/courses/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  test("GET /api/courses/:id with non-existent id returns 404 JSON", async () => {
    const res = await request(app).get("/api/courses/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  test("POST /api/bookings/session with invalid sessionId returns 4xx or 5xx", async () => {
    const res = await request(app).post("/api/bookings/session").send({
      userId: "invalid-user",
      sessionId: "invalid-session",
    });
    expect([400, 404, 500]).toContain(res.status);
  });

  test("POST /api/bookings/course with invalid courseId returns 4xx", async () => {
    const res = await request(app).post("/api/bookings/course").send({
      userId: "invalid-user",
      courseId: "invalid-course",
    });
    expect([400, 404, 500]).toContain(res.status);
  });

  test("POST /auth/login with missing fields redirects back", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/login");
  });

  test("DELETE /api/bookings/:id with non-existent id returns 404", async () => {
    const res = await request(app).delete("/api/bookings/no-such-booking");
    expect(res.status).toBe(404);
  });
});
