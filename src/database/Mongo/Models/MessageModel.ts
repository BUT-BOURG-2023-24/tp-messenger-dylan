import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../../types";
import { IUser } from "./UserModel";
import { IReaction, ReactionSchema } from "./ReactionModel";

export interface IMessage extends Document {
  //A COMPLETER
  _id: MongooseID;
  conversationId: MongooseID;
  from: IUser;
  replyTo: IUser;
  content: string;
  postedAt: Date;
  edited: boolean;
  deleted: boolean;
  reactions: Array<IReaction>;
}

export const messageSchema: Schema<IMessage> = new Schema<IMessage>({
  //A COMPLETER
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  from: { type: Schema.Types.ObjectId, ref: "User", required: true },
  replyTo: { type: Schema.Types.ObjectId, ref: "User" },
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
  reactions: [ReactionSchema],
});

export const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
