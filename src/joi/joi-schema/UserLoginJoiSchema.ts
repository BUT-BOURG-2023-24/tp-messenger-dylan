import { object, string } from "joi";

export const userLoginSchema = object({
  username: string().min(3).required(),
  password: string().min(1).required(),
});
