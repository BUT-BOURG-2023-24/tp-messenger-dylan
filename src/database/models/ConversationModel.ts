import mongoose, { Schema, Document } from "mongoose";
import { IMessage } from "./MessageModel";
import { IUser } from "./UserModel";
import { MongooseID } from "../../types";

export interface IConversation extends Document {
  title: string;
  lastUpdate: Date;
  participants: Array<IUser>;
  messages: Array<IMessage>;
  seen: Map<MongooseID, MongooseID>;
}

export const conversationSchema: Schema<IConversation> =
  new Schema<IConversation>({
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
    seen: {
      type: Map,
      of: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
      required: true,
    },
  });

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
