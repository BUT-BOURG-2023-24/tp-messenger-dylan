import { IUser } from "./UserModel";

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
