import { array, object, string } from "joi";

export const newConversationMessageJoiSchema = object({
  content: string().required,
  messageReplyId: string(),
});
