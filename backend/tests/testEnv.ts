import "dotenv/config";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is not defined");
}

// Force Prisma to use the test PostgreSQL database during Vitest.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

process.env.JWT_SECRET = "test-jwt-secret";