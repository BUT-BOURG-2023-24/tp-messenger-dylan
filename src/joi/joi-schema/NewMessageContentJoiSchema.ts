import { object, string } from "joi";

export const newMessageContentJoiSchema = object({
  newMessageContent: string().required,
});
