import * as http from "http";
import express, { Application } from "express";
import { Server } from "socket.io";
import { Database } from "./database/Database";
import { SocketController } from "./socket/socketController";
import { joiValidatorMiddleware } from "./middlewares/JoiValidatorMiddleware";
import { UserController } from "./controllers/UserController";
import { ConversationController } from "./controllers/ConversationController";
import { MessageController } from "./controllers/MessageController";

const app: Application = express();

function makeApp(database: Database) {
  const server = http.createServer(app);

  app.use(express.json());
  app.use(joiValidatorMiddleware);

  const io = new Server(server, { cors: { origin: "*" } });
  const socketController = new SocketController(io, database);

  app.locals.database = database;
  app.locals.socketController = socketController;

  new UserController(app);
  new ConversationController(app);
  new MessageController(app);

  database.connect();

  return { app, server };
}

export { makeApp };
