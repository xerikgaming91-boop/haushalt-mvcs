import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/AppError.js";
import { passwordResetRepository } from "./passwordReset.repository.js";

const RESET_TTL_MINUTES = 60;

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export const passwordResetService = {
  /**
   * Security note:
   * - Returns { ok: true } regardless of whether the email exists (prevents enumeration).
   * - For local dev we log the reset link to the server console.
   */
  async requestReset(email) {
    const user = await passwordResetRepository.findUserByEmail(email);

    // Always succeed (no user enumeration)
    if (!user) {
      return { ok: true };
    }

    const token = crypto.randomBytes(32).toString("hex"); // 64 chars
    const tokenHash = sha256Hex(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    await passwordResetRepository.createToken({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    const link = `${env.APP_BASE_URL}/reset?token=${encodeURIComponent(token)}`;

    // In production, send this link via email (SMTP provider).
    // For now, we log it (local dev).
    console.log("[PasswordReset] Reset link for", email, "=>", link);

    return { ok: true };
  },

  async resetPassword({ token, newPassword }) {
    const tokenHash = sha256Hex(token);
    const record = await passwordResetRepository.findValidTokenByHash(tokenHash);

    if (!record) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await passwordResetRepository.resetPasswordTransaction({
      tokenId: record.id,
      userId: record.userId,
      passwordHash
    });

    return { ok: true };
  }
};
