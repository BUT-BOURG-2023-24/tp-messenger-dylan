import { object, string } from "joi";
import { reactionTypeValidator } from "../../database/models/ReactionModel";

export const messageReactionAddingJoiSchema = object({
  reaction: string().valid(reactionTypeValidator.values),
});
