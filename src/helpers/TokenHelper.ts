import { JwtPayload, sign, verify } from "jsonwebtoken";
import config from "../config";
import { Code400HttpError } from "../error/HttpError";

export class TokenHelper {
  public static decodeUserToken(token: string): string | JwtPayload {
    try {
      const userTokenPayload: string | JwtPayload = verify(
        token,
        config.JWT_SECRET
      );

      return userTokenPayload;
    } catch (error) {
      throw new Code400HttpError("The token is invalid");
    }
  }

  public static generateUserToken(userId: string) {
    const token = sign({ userId }, config.JWT_SECRET, { expiresIn: "1h" });

    return token;
  }
}
