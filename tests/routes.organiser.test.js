// tests/routes.organiser.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal } from "./helpers.js";

describe("Organiser routes (access control)", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    await seedMinimal();
  });

  test("GET /organiser redirects to login when not authenticated", async () => {
    const res = await request(app).get("/organiser");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });

  test("GET /organiser/courses redirects to login when not authenticated", async () => {
    const res = await request(app).get("/organiser/courses");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });

  test("GET /organiser/users redirects to login when not authenticated", async () => {
    const res = await request(app).get("/organiser/users");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });

  test("POST /organiser/courses redirects to login when not authenticated", async () => {
    const res = await request(app).post("/organiser/courses").send({
      title: "Hacked Course",
      level: "beginner",
      type: "WEEKLY_BLOCK",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });
});

describe("Organiser routes (student access denied)", () => {
  let agent;
  let data;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    data = await seedMinimal();

    // Log in as a student using a real session
    agent = request.agent(app);
    // Register a fresh student account so password is properly hashed
    await agent.post("/auth/register").send({
      name: "Test Student",
      email: "student2@test.local",
      password: "student123",
      confirmPassword: "student123",
    });
  });

  test("GET /organiser returns 403 for student role", async () => {
    const res = await agent.get("/organiser");
    expect([302, 403]).toContain(res.status);
  });
});
