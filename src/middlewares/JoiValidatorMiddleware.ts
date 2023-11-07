import joi from "joi";
import { Request, Response, NextFunction } from "express";
import { Code400HttpError, HttpError } from "../error/HttpError";

export function joiValidatorMiddleware(joiSchema: joi.ObjectSchema<any>) {
  return (request: Request, response: Response, next: NextFunction) => {
    const schemaValidation = joiSchema.validate(request.body);

    try {
      if (schemaValidation.error)
        throw new Code400HttpError(schemaValidation.error.message);

      next();
    } catch (error: unknown) {
      const httpError: HttpError = HttpError.handleUnknownError(error);

      response.status(httpError.status).send({
        error: httpError.message,
      });
    }
  };
}
