import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../../types";
import { IMessage } from "./MessageModel";
import { IUser } from "./UserModel";

export interface IConversation extends Document {
  //A COMPLETER
  _id: MongooseID;
  title: string;
  lastUpdate: Date;
  participants: Array<IUser>;
  messages: Array<IMessage>;
  seen: Array<{
    user: IUser;
    message: IMessage;
  }>;
}

export const conversationSchema: Schema<IConversation> =
  new Schema<IConversation>({
    //A COMPLETER
    title: {
      type: String,
      required: true,
    },
    lastUpdate: {
      type: Date,
      required: true,
    },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
    seen: [
      new Schema({
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        message: {
          type: Schema.Types.ObjectId,
          ref: "Message",
        },
      }),
    ],
  });

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
