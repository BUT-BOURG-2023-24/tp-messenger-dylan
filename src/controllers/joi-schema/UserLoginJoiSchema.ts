import joi from "joi";

export const userLoginJoiSchema = joi.object({
  username: joi.string().min(3).required(),
  password: joi.string().required(),
});
