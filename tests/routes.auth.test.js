// tests/routes.auth.test.js
import request from "supertest";
import { app } from "../index.js";
import { resetDb } from "./helpers.js";
import { UserModel } from "../models/userModel.js";

describe("Authentication routes", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await resetDb();
    // Create a real user with hashed password for login tests
    await UserModel.create({
      name: "Auth Test User",
      email: "auth@test.local",
      password: "testpass123",
      role: "student",
    });
  });

  test("POST /auth/register with valid data creates account and redirects", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "New User",
      email: "newuser@test.local",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/");
  });

  test("POST /auth/register with mismatched passwords redirects back with error", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Bad User",
      email: "bad@test.local",
      password: "password123",
      confirmPassword: "wrongpassword",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/register");
  });

  test("POST /auth/register with short password redirects back", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Short Pass",
      email: "short@test.local",
      password: "abc",
      confirmPassword: "abc",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/register");
  });

  test("POST /auth/register with duplicate email redirects back", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Duplicate",
      email: "auth@test.local",
      password: "testpass123",
      confirmPassword: "testpass123",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/register");
  });

  test("POST /auth/login with valid credentials redirects to /", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "auth@test.local",
      password: "testpass123",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/");
  });

  test("POST /auth/login with wrong password redirects back", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "auth@test.local",
      password: "wrongpassword",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/login");
  });

  test("POST /auth/login with unknown email redirects back", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "nobody@test.local",
      password: "testpass123",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/auth/login");
  });

  test("GET /auth/logout redirects to login", async () => {
    const res = await request(app).get("/auth/logout");
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/login/i);
  });
});
