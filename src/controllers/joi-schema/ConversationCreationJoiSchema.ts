import joi from "joi";

export const conversationCreationJoiSchema = joi.object({
  concernedUsersIds: joi.array().items(joi.string()).required(),
});
