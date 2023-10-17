import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../../types";

export interface IMessage extends Document {
	//A COMPLETER
}

const MessageSchema: Schema<IMessage> = new Schema<IMessage>({
	//A COMPLETER
});

const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);

export { MessageModel, MessageSchema };
