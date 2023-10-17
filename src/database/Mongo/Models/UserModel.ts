import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../../types";

export interface IUser extends Document {
  //A COMPLETER
  _id: MongooseID;
  username: string;
  password: string;
  profilePicId: string;
}

export const userSchema: Schema<IUser> = new Schema<IUser>({
  //A COMPLETER
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
