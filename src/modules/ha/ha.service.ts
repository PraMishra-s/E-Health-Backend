import { ErrorCode } from "../../common/enums/error-code.enum";
import redis from "../../common/service/redis.service";
import { compareValue, hashValue } from "../../common/utils/bcrypt";
import { BadRequestException, InternalServerException, NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { anHourFromNow } from "../../common/utils/date-time";
import { generateUniqueCode } from "../../common/utils/uuid";
import { db } from "../../database/drizzle";
import { ha_details, login, users } from "../../database/schema/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../../mailer/mailer";
import { passwordResetTemplate } from "../../mailer/template/template";
import { config } from "../../config/app.config";

export class HaService{
    public async forgotPassword(email: string, secretWord: string) {
    const userResult = await db.select().from(login).where(eq(login.email, email)).limit(1);
    if (userResult.length === 0) {
        throw new NotFoundException(
            "User not found.",
            ErrorCode.AUTH_USER_NOT_FOUND
        );
    }
    const user = userResult[0];
    if (user.role !== "HA") {
        throw new BadRequestException(
            "Password reset via this flow is only for HA users.",
            ErrorCode.ACCESS_FORBIDDEN
        );
    }
    const haResult = await db
        .select()
        .from(ha_details)
        .where(eq(ha_details.ha_id, user.user_id))
        .limit(1);
    if (haResult.length === 0) {
        throw new NotFoundException(
            "HA details not found.",
            ErrorCode.AUTH_USER_NOT_FOUND
        );
    }
    const haRecord = haResult[0];

    const isSecretValid = await compareValue(secretWord, haRecord.secret_key);
    if (!isSecretValid) {
        throw new UnauthorizedException(
            "Invalid secret word.",
            ErrorCode.SECRET_WRONG
        );
    }
    const userId = haResult[0].ha_id

    const rateLimitKey = `password-reset:rate-limit:${userId}`;
    const requestCount = await redis.incr(rateLimitKey); 
    if (requestCount === 1) {
        await redis.expire(rateLimitKey, 180); 
    } else if (requestCount > 2) {
        throw new BadRequestException(
            "Too many requests, try again later",
            ErrorCode.AUTH_TOO_MANY_ATTEMPTS
        );
    }
    const otpTTL = 240;
    const expiresAt = new Date(Date.now() + otpTTL * 1000)
    const resetCode = generateUniqueCode();
    const redisKey = `password-reset:code:${resetCode}`;
    await redis.set(redisKey, userId, { ex: 240 }); 

      const resetLink = `${config.APP_ORIGIN}/reset-password?code=${resetCode}&exp=${expiresAt.getTime()}`;
      const { data, error } = await sendEmail({
          to: email,
          ...passwordResetTemplate(resetLink)
      });
      if (!data) {
          throw new InternalServerException(`${error?.name} - ${error?.message}`);
      }
      return {
          url: resetLink,
          emailId: data.response
      };
    }
    public async changeSecretWord(userId: string, currentSecret: string, newSecret: string) {
        const userResult = await db.select().from(ha_details).where(eq(ha_details.ha_id, userId));

        if (userResult.length === 0) {
            throw new NotFoundException(
                "User not found.", 
                ErrorCode.AUTH_NOT_FOUND
            );
        }

        const user = userResult[0];

        const isSecretValid = await compareValue(currentSecret, user.secret_key);
        if (!isSecretValid) {
            throw new BadRequestException(
                "Current secret is incorrect.",
                ErrorCode.SECRET_WRONG
            );
        }

        const hashedNewSecret = await hashValue(newSecret);

        await db.update(ha_details)
            .set({ secret_key: hashedNewSecret })
            .where(eq(ha_details.ha_id, userId));

        return;
    }

    
}
