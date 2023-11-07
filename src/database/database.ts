import bcrypt from "bcrypt";
import { ConversationModel, IConversation } from "./models/ConversationModel";
import { IMessage } from "./models/MessageModel";
import { ReactionType } from "./models/ReactionModel";
import { IUser, UserModel } from "./models/UserModel";
import { MongooseID } from "../types";
import { Code401HttpError } from "../error/HttpError";

class Database {
  fromTest: boolean;

  constructor(fromTest: boolean) {
    this.fromTest = fromTest;
  }

  async connect() {
    // config.DB_ADDRESS contient l'adresse de la BDD
  }

  public async createUser(user: IUser): Promise<void> {
    const hashedPassword = await bcrypt.hash(user.password, 5);

    user.password = hashedPassword;

    await user.save();
  }

  public async getUserByName(username: string): Promise<IUser | null> {
    const user: IUser | null = await UserModel.findOne({
      username: username,
    }).exec();

    return user;
  }

  public async getUserById(userId: MongooseID): Promise<IUser | null> {
    const user: IUser | null = await UserModel.findById(userId).exec();

    return user;
  }

  public async getUsersByIds(userIds: Array<string>): Promise<Array<IUser>> {
    const users: Array<IUser> = await UserModel.find({
      _id: { $in: userIds },
    }).exec();

    return users;
  }

  public async getConversationWithParticipants(
    conversationId: MongooseID
  ): Promise<IConversation | null> {
    const conversation = await ConversationModel.findById(conversationId);

    await conversation?.populate("participants");

    return conversation;
  }

  public getAllConversationsForUser(
    user: IUser
  ): Promise<Array<IConversation>> {
    return ConversationModel.find({ "participants._id": user.id });
  }

  public getConversationById(
    conversationId: MongooseID
  ): Promise<IConversation | null> {
    return ConversationModel.findById(conversationId);
  }

  public async createConversation(conversation: IConversation): Promise<void> {
    await conversation.save();
  }

  public async checkIfUserIsConversationParticipant(
    user: IUser,
    conversation: IConversation
  ): Promise<boolean> {
    await conversation.populate("participants._id");

    const userIsParticipant = conversation.participants.includes(user.id);

    if (userIsParticipant) return true;

    return false;
  }

  public async addMessageToConversation(
    conversation: IConversation,
    message: IMessage
  ): Promise<void> {
    message.conversationId = conversation.id;

    await message.save();
  }

  public async setConversationSeenForUserAndMessage(
    conversation: IConversation,
    user: IUser,
    message: IMessage
  ): Promise<void> {
    conversation.seen.push({
      user: user.id,
      message: message.id,
    });

    await conversation.save();
  }

  public async deleteConversation(conversation: IConversation): Promise<void> {
    await ConversationModel.deleteOne({ _id: conversation.id });
  }

  public async createMessage(message: IMessage): Promise<void> {
    await message.save();
  }

  public async editMessage(
    message: IMessage,
    newContent: string
  ): Promise<void> {
    message.content = newContent;
    message.edited = true;

    await message.save();
  }

  public async deleteMessage(message: IMessage): Promise<void> {
    message.deleted = true;

    await message.save();
  }

  public async reactToMessage(
    message: IMessage,
    user: IUser,
    reactionType: ReactionType
  ): Promise<void> {
    message.reactions.push({
      user: user.id,
      reaction: reactionType,
    });

    await message.save();
  }

  public getMessageById(messageId: MongooseID): Promise<IMessage | null> {
    return ConversationModel.findById(messageId);
  }

  public async checkIfUserIsMessageAuthor(
    user: IUser,
    message: IMessage
  ): Promise<boolean> {
    await message.from.populate("from._id");

    return message.from.id === user.id;
  }
}

export default Database;
export type { Database };
