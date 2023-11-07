import { object, string } from "joi";

export const seeConversationMessageJoiSchema = object({
  messageId: string().required,
});
