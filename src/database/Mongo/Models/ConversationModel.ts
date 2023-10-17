import mongoose, { Schema, Document } from "mongoose";
import { MongooseID } from "../../../types";

export interface IConversation extends Document {
	//A COMPLETER
}

const conversationSchema: Schema<IConversation> = new Schema<IConversation>({
	//A COMPLETER
});

const ConversationModel = mongoose.model<IConversation>("Conversation", conversationSchema);

export default ConversationModel;