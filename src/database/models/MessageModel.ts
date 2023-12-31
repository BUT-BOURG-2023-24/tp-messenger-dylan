import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../types";
import { IUser } from "./UserModel";
import { ReactionType, reactionTypeValidator } from "./ReactionModel";

export interface IMessage extends Document {
  conversationId: MongooseID;
  from: IUser;
  replyTo: IMessage;
  content: string;
  postedAt: Date;
  edited: boolean;
  deleted: boolean;
  reactions: Map<MongooseID, ReactionType>;
}

export const messageSchema: Schema<IMessage> = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
  content: {
    type: String,
    required: true,
  },
  postedAt: {
    type: Date,
    required: true,
  },
  edited: {
    type: Boolean,
    required: true,
  },
  deleted: {
    type: Boolean,
    required: true,
  },
  reactions: {
    type: Map,
    of: { type: String, enum: reactionTypeValidator },
    required: true,
  },
});

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
