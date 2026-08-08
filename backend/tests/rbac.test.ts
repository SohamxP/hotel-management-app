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
let managerToken: string;
let frontDeskToken: string;

beforeAll(async () => {
  await resetTestDatabase();

  const appModule = await import("../app");
  app = appModule.default;

  const managerLogin = await request(app)
    .post("/api/auth/login")
    .send({
      username: "admin",
      password: "admin123",
    });

  managerToken = managerLogin.body.token;

  const frontDeskLogin = await request(app)
    .post("/api/auth/login")
    .send({
      username: "frontdesk",
      password: "frontdesk123",
    });

  frontDeskToken = frontDeskLogin.body.token;
});

afterAll(() => {
  removeTestDatabase();
});

describe("Role-based access control", () => {
  it("allows Manager to access reports", async () => {
    const response = await request(app)
      .get("/api/reports/room-type-summary")
      .set(
        "Authorization",
        `Bearer ${managerToken}`
      );

    expect(response.status).toBe(200);
  });

  it("allows Front Desk to access reservations", async () => {
    const response = await request(app)
      .get("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${frontDeskToken}`
      );

    expect(response.status).toBe(200);
  });

  it("forbids Front Desk from accessing reports", async () => {
    const response = await request(app)
      .get("/api/reports/room-type-summary")
      .set(
        "Authorization",
        `Bearer ${frontDeskToken}`
      );

    expect(response.status).toBe(403);

    expect(response.body).toMatchObject({
      error:
        "You do not have permission to perform this action",
    });
  });

  it("forbids Front Desk from accessing AI tools", async () => {
    const response = await request(app)
      .get("/api/ai/insights")
      .set(
        "Authorization",
        `Bearer ${frontDeskToken}`
      );

    expect(response.status).toBe(403);
  });
});