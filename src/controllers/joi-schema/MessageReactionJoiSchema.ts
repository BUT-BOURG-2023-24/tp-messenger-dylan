import joi from "joi";
import { reactionTypeValidator } from "../../database/models/ReactionModel";

export const messageReactionJoiSchema = joi.object({
  reaction: joi.string().valid(...reactionTypeValidator.values),
});
