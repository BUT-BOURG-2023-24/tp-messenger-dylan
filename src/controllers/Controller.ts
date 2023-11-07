import { Application, Request, Router } from "express";
import { IUser } from "../database/models/UserModel";
import { Code500HttpError } from "../error/HttpError";

export class Controller {
  protected readonly database;
  protected readonly socketController;

  protected readonly router = Router();

  public constructor(app: Application, apiRoute: string) {
    this.database = app.locals.database;
    this.socketController = app.locals.sockerController;

    app.use(apiRoute, this.router);
  }

  protected getCurrentUser(request: Request): IUser {
    const currentUser: IUser | undefined = request.currentUser;

    if (!currentUser)
      throw new Code500HttpError("The CheckJwtMiddleware doesn't work");

    return currentUser;
  }
}
