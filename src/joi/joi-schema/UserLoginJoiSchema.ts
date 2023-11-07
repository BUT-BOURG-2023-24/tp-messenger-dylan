import { object, string } from "joi";

export const userLoginJoiSchema = object({
  username: string().min(3).required(),
  password: string().required(),
});
