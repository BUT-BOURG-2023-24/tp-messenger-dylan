import joi from "joi";

export const newConversationMessageJoiSchema = joi.object({
  messageContent: joi.string().required(),
  messageReplyId: joi.string(),
});
