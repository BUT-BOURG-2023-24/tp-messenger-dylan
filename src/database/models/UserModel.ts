import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  profilePicId: string;
}

export const userSchema: Schema<IUser> = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicId: {
    type: String,
    required: true,
  },
});

export const UserModel = mongoose.model<IUser>("User", userSchema);
