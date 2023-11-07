export class HttpError extends Error {
  public constructor(public status: number, message: string) {
    super(message);
  }

  public static handleUnknownError(error: unknown): HttpError {
    if (error instanceof HttpError) return error;
    if (error instanceof Error) return new Code500HttpError(error.message);

    return new Code500HttpError("Une erreur est survenue");
  }
}

export class Code400HttpError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export class Code401HttpError extends HttpError {
  constructor(message: string) {
    super(401, message);
  }
}

export class Code404HttpError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class Code500HttpError extends HttpError {
  constructor(message: string) {
    super(500, message);
  }
}
