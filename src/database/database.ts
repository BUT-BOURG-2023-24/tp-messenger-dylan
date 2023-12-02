import { hash } from "bcrypt";
import { ConversationModel, IConversation } from "./models/ConversationModel";
import { IMessage, MessageModel } from "./models/MessageModel";
import { ReactionType } from "./models/ReactionModel";
import { IUser, UserModel } from "./models/UserModel";
import { MongooseID } from "../types";
import { connect } from "mongoose";
import config from "../config";

export class Database {
  public constructor(public readonly fromTest: boolean) {}

  public async connect() {
    const databaseAddress = this.fromTest
      ? config.DB_ADDRESS_TEST
      : config.DB_ADDRESS;

    await connect(`mongodb://${databaseAddress}/${config.DB_NAME}`, {
      authSource: "admin",
      user: "messenger_user",
      pass: "12345",
    });
  }

  public async createUser(user: IUser): Promise<void> {
    const hashedPassword: string = await hash(user.password, 5);

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

  public getAllUsers(): Promise<Array<IUser>> {
    return UserModel.find().exec();
  }

  public getAllConversationsForUser(
    user: IUser
  ): Promise<Array<IConversation>> {
    return ConversationModel.find({
      participants: {
        _id: user._id,
      },
    })
      .populate({
        path: "messages",
        populate: {
          path: "from",
        },
        match: {
          deleted: false,
        },
      })
      .populate({
        path: "participants",
      });
  }

  public getConversationById(
    conversationId: MongooseID
  ): Promise<IConversation | null> {
    return ConversationModel.findById(conversationId);
  }

  public async createConversation(conversation: IConversation): Promise<void> {
    await conversation.save();

    await conversation.populate({
      path: "participants",
    });
  }

  public async updateConversation(conversation: IConversation): Promise<void> {
    conversation.lastUpdate = new Date();

    await conversation.save();
  }

  public async checkIfUserIsConversationParticipant(
    user: IUser,
    conversation: IConversation
  ): Promise<boolean> {
    await conversation.populate("participants");

    const userIsParticipant =
      conversation.participants.findIndex((participant) => {
        return participant.id === user.id;
      }) >= 0;

    if (userIsParticipant) return true;

    return false;
  }

  public async addMessageToConversation(
    conversation: IConversation,
    message: IMessage
  ): Promise<void> {
    message.conversationId = conversation.id;

    await message.save();

    conversation.messages.push(message);
    conversation.lastUpdate = new Date();

    await conversation.save();
  }

  public async setConversationSeenForUserAndMessage(
    conversation: IConversation,
    user: IUser,
    message: IMessage
  ): Promise<void> {
    conversation.seen.set(user.id, message.id);

    await conversation.save();
  }

  public async deleteConversation(conversation: IConversation): Promise<void> {
    await ConversationModel.deleteOne({ _id: conversation.id });
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
    reactionType?: ReactionType
  ): Promise<void> {
    if (reactionType) {
      message.reactions.set(user.id, reactionType);
    } else {
      message.reactions.delete(user.id);
    }

    await message.save();
  }

  public getMessageById(messageId: MongooseID): Promise<IMessage | null> {
    return MessageModel.findById(messageId);
  }

  public async checkIfUserIsMessageAuthor(
    user: IUser,
    message: IMessage
  ): Promise<boolean> {
    await message.populate("from");

    return message.from.id === user.id;
  }
}
