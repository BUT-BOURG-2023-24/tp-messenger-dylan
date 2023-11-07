import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { IUser } from "../database/models/UserModel";
import { checkJwtMiddleware } from "../middlewares/CheckJwtMiddleware";
import { Code401HttpError, Code404HttpError } from "../error/HttpError";
import {
  ConversationModel,
  IConversation,
} from "../database/models/ConversationModel";
import { IMessage, MessageModel } from "../database/models/MessageModel";

export class ConversationController extends Controller {
  public constructor(app: Application) {
    super(app, "conversations");

    this.router.use(checkJwtMiddleware);

    this.router.post("", this.createConversation);
    this.router.get("", this.getUserConversations);
    this.router.delete(":conversation_id", this.deleteConversation);
    this.router.post("see/:conversation_id", this.seeConversationMessage);
    this.router.post(":conversation_id", this.sendMessage);
  }

  private async createConversation(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedUsersIds: Array<string> = request.body.concernedUsersIds;

    concernedUsersIds.push(currentUser.id);

    const newConversation: IConversation = new ConversationModel({
      title: new Date().toLocaleString(),
      lastUpdate: new Date(),
      participants: concernedUsersIds,
      messages: new Array(),
      seen: new Array(),
    });

    await this.database.createConversation(newConversation);

    response.status(200).send({
      conversation: {
        _id: newConversation.id,
      },
    });
  }

  private async getUserConversations(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const userConversations = await this.database.getAllConversationsForUser(
      currentUser
    );

    response.status(200).send({
      conversations: userConversations.map((userConversation) => {
        return {
          _id: userConversation.id,
          title: userConversation.title,
        };
      }),
    });
  }

  private async deleteConversation(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedConversation: IConversation =
      await this.getConvernedConversation(request);

    await this.checkIfCurrentUserIsParticipant(
      currentUser,
      concernedConversation
    );

    await this.database.deleteConversation(concernedConversation);

    response.status(200).send({
      conversation: {
        _id: concernedConversation.id,
      },
    });
  }

  private async seeConversationMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedConversation: IConversation =
      await this.getConvernedConversation(request);

    await this.checkIfCurrentUserIsParticipant(
      currentUser,
      concernedConversation
    );

    const messageIdToSee: string = request.body.messageId;

    const messageToSee: IMessage | null = await this.database.getMessageById(
      messageIdToSee
    );

    if (!messageToSee)
      throw new Code404HttpError(
        "This message passed to the body doesn't exist"
      );

    await this.database.setConversationSeenForUserAndMessage(
      concernedConversation,
      currentUser,
      messageToSee
    );

    response.status(200).send({
      conversation: {
        _id: concernedConversation.id,
      },
    });
  }

  private async sendMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedConversation: IConversation =
      await this.getConvernedConversation(request);

    await this.checkIfCurrentUserIsParticipant(
      currentUser,
      concernedConversation
    );

    const messageReplyId: string | undefined = request.body.messageReplyId;

    const newMessage: IMessage = new MessageModel({
      from: currentUser,
      replyTo: messageReplyId,
      content: request.body.content,
      postedAt: new Date(),
      edited: false,
      deleted: false,
      reactions: new Array(),
    });

    await this.database.addMessageToConversation(
      concernedConversation,
      newMessage
    );

    response.status(200).send({
      conversation: {
        _id: concernedConversation.id,
      },
    });
  }

  private async getConvernedConversation(
    request: Request
  ): Promise<IConversation> {
    const concernedConversationId: string = request.params.conversation_id;

    const concernedConversation: IConversation | null =
      await this.database.getConversationById(concernedConversationId);

    if (!concernedConversation)
      throw new Code404HttpError(
        "This conversation passed to the parameters doesn't exist"
      );

    return concernedConversation;
  }

  private async checkIfCurrentUserIsParticipant(
    currentUser: IUser,
    concernedConversation: IConversation
  ): Promise<void> {
    const currentUserIsParticipant =
      await this.database.checkIfUserIsConversationParticipant(
        currentUser,
        concernedConversation
      );

    if (!currentUserIsParticipant)
      throw new Code401HttpError(
        "You can't modify this conversation because you are not a participant of it"
      );
  }
}
