import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import { authRepository } from "./auth.repository.js";

export const authService = {
  async register({ email, name, password }) {
    const existing = await authRepository.findUserByEmail(email);
    if (existing) throw new AppError("Email already in use", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await authRepository.createUser({ email, name, passwordHash });
    return user;
  },

  async login({ email, password }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new AppError("Invalid credentials", 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401);

    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token, user: { id: user.id, email: user.email, name: user.name } };
  },

  async me(userId) {
    const me = await authRepository.findUserById(userId);
    if (!me) throw new AppError("User not found", 404);
    return me;
  }
};
