// tests/routes.ssr.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal } from "./helpers.js";

describe("SSR view routes", () => {
  let data;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();
  });

  test("GET / returns 200 HTML with course listing", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Yoga|Mindfulness|Courses/i);
  });

  test("GET /courses returns 200 HTML and shows Test Course", async () => {
    const res = await request(app).get("/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses?level=beginner filters by level", async () => {
    const res = await request(app).get("/courses?level=beginner");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses?q=vinyasa returns no results for unmatched search", async () => {
    const res = await request(app).get("/courses?q=vinyasaXYZnotexist");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/No courses match/i);
  });

  test("GET /courses/:id returns 200 HTML with course title", async () => {
    const res = await request(app).get(`/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses/:id with bad id returns 404 HTML", async () => {
    const res = await request(app).get("/courses/notarealid");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  test("GET /auth/login returns 200 HTML with login form", async () => {
    const res = await request(app).get("/auth/login");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Login/i);
    expect(res.text).toMatch(/email/i);
  });

  test("GET /auth/register returns 200 HTML with register form", async () => {
    const res = await request(app).get("/auth/register");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Register|Create/i);
  });

  test("GET /my-bookings redirects to login when not authenticated", async () => {
    const res = await request(app).get("/my-bookings");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });

  test("POST /courses/:id/book redirects to login when not authenticated", async () => {
    const res = await request(app).post(`/courses/${data.course._id}/book`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });
});
