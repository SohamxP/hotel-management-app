import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as authRepository from "../repositories/authRepository";
import { AppError } from "../errors/AppError";

type LoginInput = {
  username: string;
  password: string;
};

export async function login(input: LoginInput) {
  const { username, password } = input;

  if (!username || !password) {
    throw new AppError(400, "Username and password are required");
  }

  const user =
    await authRepository.findUserByUsername(username);

  if (!user || !user.IsActive) {
    throw new AppError(401, "Invalid username or password");
  }

  const passwordMatches =
    await bcrypt.compare(password, user.PasswordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid username or password");
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign(
    {
      userId: user.UserID,
      employeeId: user.EmployeeID,
      username: user.Username,
      role: user.Position,
    },
    secret,
    {
      expiresIn: "1h",
    }
  );

  return {
    success: true,
    token,
    user: {
      userId: user.UserID,
      employeeId: user.EmployeeID,
      username: user.Username,
      firstName: user.FirstName,
      lastName: user.LastName,
      role: user.Position,
    },
  };
}