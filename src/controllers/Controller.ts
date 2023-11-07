import { Application, Request, Router } from "express";
import { IUser } from "../database/models/UserModel";
import { Code500HttpError } from "../error/HttpError";

export class Controller {
  protected readonly router = Router();

  public constructor(app: Application, apiRoute: string) {
    app.use(apiRoute, this.router);
  }

  protected static getCurrentUser(request: Request): IUser {
    const currentUser: IUser | undefined = request.currentUser;

    if (!currentUser)
      throw new Code500HttpError("The CheckJwtMiddleware doesn't work");

    return currentUser;
  }
}
