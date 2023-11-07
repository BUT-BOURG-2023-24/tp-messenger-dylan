import { Application, Router } from "express";

export class Controller {
  protected readonly database;
  protected readonly socketController;

  protected readonly router = Router();

  public constructor(app: Application, apiRoute: string) {
    this.database = app.locals.database;
    this.socketController = app.locals.sockerController;

    app.use(apiRoute, this.router);
  }
}
