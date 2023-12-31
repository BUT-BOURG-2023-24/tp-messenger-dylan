import mongoose, { Schema } from "mongoose";
import { Database } from "./database/Database";
import { SocketController } from "./socket/socketController";
import { ConversationController } from "./database/Mongo/Controllers/conversationController";
import { IUser } from "./database/models/UserModel";

export type MongooseID = Schema.Types.ObjectId | string | null;

declare global {
  namespace Express {
    interface Locals {
      database: Database;
      socketController: SocketController;
    }
    interface Request {
      currentUser?: IUser;
    }
  }

  var Database: Database;
  var conv: ConversationController?;
}
