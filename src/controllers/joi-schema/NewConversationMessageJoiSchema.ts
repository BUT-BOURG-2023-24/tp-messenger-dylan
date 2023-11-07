import joi from "joi";

export const newConversationMessageJoiSchema = joi.object({
  content: joi.string().required,
  messageReplyId: joi.string(),
});
