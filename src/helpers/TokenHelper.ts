import { JwtPayload, sign, verify } from "jsonwebtoken";
import config from "../config";
import { Code401HttpError } from "../error/HttpError";
import { IUser } from "../database/models/UserModel";

export class TokenHelper {
  public static decodeUserToken(token: string): string | JwtPayload {
    try {
      const userTokenPayload: string | JwtPayload = verify(
        token,
        config.JWT_SECRET
      );

      return userTokenPayload;
    } catch (error) {
      throw new Code401HttpError("The token is invalid");
    }
  }

  public static generateUserToken(user: IUser) {
    const token = sign({ sub: user.id, user: user }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    return token;
  }
}
