import { ExtractJwt,  Strategy as JwtStrategy, StrategyOptionsWithRequest } from "passport-jwt"
import { UnauthorizedException } from "../utils/catch-errors";
import { ErrorCode } from "../enums/error-code.enum";
import { config } from "../../config/app.config";
import passport, { PassportStatic } from "passport";
import { db } from "../../database/drizzle";
import { users } from "../../database/schema/schema";
import { eq } from "drizzle-orm";


interface JwtPayload {
    userId: string,
    sessionId: string
}

const options : StrategyOptionsWithRequest = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
            const accessToken = req.cookies.accessToken;
            if(!accessToken){
                throw new UnauthorizedException(
                    "Unauthorized access Token",
                    ErrorCode.AUTH_TOKEN_NOT_FOUND
                )
            }

            return accessToken
        }
    ]),
    secretOrKey: config.JWT.SECRET,
    audience: ["user"],
    algorithms: ["HS256"],
    passReqToCallback: true
}

export const setupJwtStrategy = (passport: PassportStatic) => {
    passport.use(
        new JwtStrategy(options, async (req, payload: JwtPayload, done) => {
            try {
                const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
                if (!user) {
                return done(null, false);
                }
                req.sessionId = payload.sessionId;
                req.user = user; // This should be correctly typed as `User`
                return done(null, user);
            } catch (error) {
                return done(null, false);
            }
        })
    );
};
export const authenticateJWT = passport.authenticate("jwt", { session: false });