import joi from "joi";

export const conversationCreationJoiSchema = joi.object({
  concernedUsersIds: joi.array().items(joi.string()).min(1).required,
});
