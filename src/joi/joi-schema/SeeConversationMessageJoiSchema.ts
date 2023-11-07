import joi from "joi";

export const seeConversationMessageJoiSchema = joi.object({
  messageId: joi.string().required,
});
