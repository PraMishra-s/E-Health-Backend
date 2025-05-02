import { Response, CookieOptions } from "express"
import { config } from "../../config/app.config"
import { calculateExpirationDate } from "./date-time"

type CookiesPayloadType = {
    res: Response,
    accessToken: String | null,
    refreshToken: String | null,
}

const defaults: CookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === "production"? true: false,
    sameSite: config.NODE_ENV === "production"? "none": "lax"
}
export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh`

export const getRefreshTokenCookieOptions = (): CookieOptions => {
    const expiresIn = config.JWT.REFRESH_EXPIRES_IN;
    const expires = calculateExpirationDate(expiresIn);
    return {
      ...defaults,
      expires,
      path: REFRESH_PATH,
    };
  };
  
  export const getAccessTokenCookieOptions = (): CookieOptions => {
    const expiresIn = config.JWT.EXPIRES_IN;
    const expires = calculateExpirationDate(expiresIn);
    return {
      ...defaults,
      expires,
      path: "/",
    };
  };
  export const setAuthenticationCookies = ({
    res,
    accessToken,
    refreshToken,
  }: CookiesPayloadType): Response =>
    res
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
  
  export const clearAuthenticationCookies = (res: Response): Response =>
    res.clearCookie("accessToken").clearCookie("refreshToken", {
      path: REFRESH_PATH,
    });