import request from "supertest";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  removeTestDatabase,
  resetTestDatabase,
} from "./setup";

let app: any;

beforeAll(async () => {
  await resetTestDatabase();

  const appModule = await import("../app");
  app = appModule.default;
});

afterAll(() => {
  removeTestDatabase();
});

describe("Authentication", () => {
  it("logs in with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "admin123",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();

    expect(response.body.user).toMatchObject({
      employeeId: 94003,
      username: "admin",
      role: "Manager",
    });
  });

  it("rejects an incorrect password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        username: "admin",
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid username or password",
    });
  });

  it("rejects missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.status).toBe(400);
  });

  it("rejects access without a token", async () => {
    const response = await request(app)
      .get("/api/reservations");

    expect(response.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const response = await request(app)
      .get("/api/reservations")
      .set(
        "Authorization",
        "Bearer invalid-token"
      );

    expect(response.status).toBe(401);
  });
});