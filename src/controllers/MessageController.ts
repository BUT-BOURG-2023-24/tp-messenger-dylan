import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { checkJwtMiddleware } from "../middlewares/CheckJwtMiddleware";
import { IUser } from "../database/models/UserModel";
import { IMessage } from "../database/models/MessageModel";
import {
  Code401HttpError,
  Code404HttpError,
  Code500HttpError,
} from "../error/HttpError";
import { IConversation } from "../database/models/ConversationModel";
import { ReactionType } from "../database/models/ReactionModel";

export class MessageController extends Controller {
  public constructor(app: Application) {
    super(app, "messages");

    this.router.use(checkJwtMiddleware);

    this.router.put("message_id", this.updateMessage);
    this.router.post("message_id", this.reactToMessage);
    this.router.delete("message_id", this.deleteMessage);
  }

  private async updateMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedMessage: IMessage = await this.getConcernedMessage(request);

    await this.checkIfCurrentUserIsAuthor(currentUser, concernedMessage);

    const newMessageContent: string = request.body.newMessageContent;

    await this.database.editMessage(concernedMessage, newMessageContent);

    response.status(200).send({
      message: {
        _id: concernedMessage.id,
      },
    });
  }

  private async reactToMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedMessage: IMessage = await this.getConcernedMessage(request);

    const convernedMessageConversation: IConversation | null =
      await this.database.getConversationById(concernedMessage.conversationId);

    if (!convernedMessageConversation)
      throw new Code500HttpError("The message hasn't a conversation parent");

    await this.checkIfCurrentUserIsParticipant(
      currentUser,
      convernedMessageConversation
    );

    const reactionTypeToAdd: string = request.body.reaction;

    await this.database.reactToMessage(
      concernedMessage,
      currentUser,
      reactionTypeToAdd as ReactionType
    );

    response.status(200).send({
      message: {
        _id: concernedMessage.id,
      },
    });
  }

  private async deleteMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = this.getCurrentUser(request);

    const concernedMessage: IMessage = await this.getConcernedMessage(request);

    await this.checkIfCurrentUserIsAuthor(currentUser, concernedMessage);

    await this.database.deleteMessage(concernedMessage);

    response.status(200).send({
      message: {
        _id: concernedMessage.id,
      },
    });
  }

  private async getConcernedMessage(request: Request): Promise<IMessage> {
    const concernedMessageId: string = request.params.conversation_id;

    const concernedMessage: IMessage | null =
      await this.database.getMessageById(concernedMessageId);

    if (!concernedMessage)
      throw new Code404HttpError(
        "This message id passed to the parameters doesn't exist"
      );

    return concernedMessage;
  }

  private async checkIfCurrentUserIsAuthor(
    currentUser: IUser,
    concernedMessage: IMessage
  ): Promise<void> {
    const currentUserIsAuthor = await this.database.checkIfUserIsMessageAuthor(
      currentUser,
      concernedMessage
    );

    if (!currentUserIsAuthor)
      throw new Code401HttpError(
        "You can't modify this message because you are not the author of it"
      );
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
