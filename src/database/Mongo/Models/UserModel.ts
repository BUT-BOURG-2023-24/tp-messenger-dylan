import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../../types";

export interface IUser extends Document {
	//A COMPLETER
}

const userSchema: Schema<IUser> = new Schema<IUser>({
	//A COMPLETER
});

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
