import { array, object, string } from "joi";

export const conversationCreationJoiSchema = object({
  concernedUsersIds: array().items(string()).min(1).required,
});
