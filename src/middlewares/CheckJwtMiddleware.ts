import { NextFunction, Request, Response } from "express";
import {
  Code400HttpError,
  Code401HttpError,
  HttpError,
} from "../error/HttpError";
import { IUser } from "../database/models/UserModel";
import { TokenHelper } from "../helpers/TokenHelper";
import { JwtPayload } from "jsonwebtoken";

export async function checkJwtMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const userToken: string | undefined = request.headers.authorization;

  try {
    if (!userToken) throw new Code401HttpError("You need a token");

    let userTokenPayload: string | JwtPayload =
      TokenHelper.decodeUserToken(userToken);

    if (!userTokenPayload.sub || typeof userTokenPayload.sub !== "string")
      throw new Code400HttpError("The token contains an invalid user id");

    const database = request.app.locals.database;

    const currentUser: IUser | null = await database.getUserById(
      userTokenPayload.sub
    );

    if (!currentUser)
      throw new Code400HttpError("The token contains an invalid user id");

    request.currentUser = currentUser;

    next();
  } catch (error: unknown) {
    const httpError: HttpError = HttpError.handleUnknownError(error);

    response.status(httpError.status).send({
      error: httpError.message,
    });
  }
}
