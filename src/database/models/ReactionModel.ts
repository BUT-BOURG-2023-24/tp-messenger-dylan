import { Schema } from "mongoose";
import { IUser } from "../Models/UserModel";

export enum ReactionType {
  HAPPY = "HAPPY",
  SAD = "SAD",
  THUMBSUP = "THUMBSUP",
  THUMBSDOWN = "THUMBSDOWN",
  LOVE = "LOVE",
}

export interface IReaction {
  user: IUser;
  reaction: ReactionType;
}

export const reactionTypeValidator = {
  values: ["HAPPY", "SAD", "THUMBSUP", "THUMBSDOWN", "LOVE"],
  message: "enum validator failed for path `{PATH}` with value `{VALUE}`",
};

export const ReactionSchema: Schema<IReaction> = new Schema<IReaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  reaction: {
    type: String,
    enum: reactionTypeValidator,
  },
});
