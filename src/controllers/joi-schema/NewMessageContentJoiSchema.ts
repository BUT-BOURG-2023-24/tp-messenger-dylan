import joi from "joi";

export const newMessageContentJoiSchema = joi.object({
  newMessageContent: joi.string().required,
});
