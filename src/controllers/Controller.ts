import { Application, Request, Response, Router } from "express";
import { HttpError } from "../error/HttpError";

export class Controller {
  protected readonly router = Router();

  public constructor(app: Application, apiRoute: string) {
    app.use(apiRoute, this.router);
  }

  protected encapsulate(
    requestHandler: (
      request: Request,
      response: Response
    ) => void | Promise<void>
  ) {
    return async (request: Request, response: Response) => {
      try {
        await requestHandler(request, response);
      } catch (error: unknown) {
        const httpError: HttpError = HttpError.handleUnknownError(error);

        response.status(httpError.status).send({
          error: httpError.message,
        });
      }
    };
  }
}
