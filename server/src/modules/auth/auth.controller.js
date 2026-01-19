import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "./auth.schemas.js";
import { authService } from "./auth.service.js";
import { passwordResetService } from "./passwordReset.service.js";
import { AppError } from "../../common/errors/AppError.js";

export const authController = {
  async register(req, res) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const user = await authService.register(parsed.data);
    return res.json({ user });
  },

  async login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);
    const result = await authService.login(parsed.data);
    return res.json(result);
  },

  async me(req, res) {
    const user = await authService.me(req.user.id);
    return res.json({ user });
  },

  async forgotPassword(req, res) {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const result = await passwordResetService.requestReset(parsed.data.email);
    return res.json(result); // always { ok: true }
  },

  async resetPassword(req, res) {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Invalid input", 400);

    const result = await passwordResetService.resetPassword(parsed.data);
    return res.json(result); // { ok: true }
  }
};
