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
    super(app, "/messages/");

    this.router.use(checkJwtMiddleware);

    this.router.put("/:message_id", this.updateMessage);
    this.router.post("/:message_id", this.reactToMessage);
    this.router.delete("/:message_id", this.deleteMessage);
  }

  private async updateMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedMessage: IMessage =
      await MessageController.getConcernedMessage(request);

    await MessageController.checkIfCurrentUserIsAuthor(
      request,
      currentUser,
      concernedMessage
    );

    const newMessageContent: string = request.body.newMessageContent;

    await request.app.locals.database.editMessage(
      concernedMessage,
      newMessageContent
    );

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
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedMessage: IMessage =
      await MessageController.getConcernedMessage(request);

    const convernedMessageConversation: IConversation | null =
      await request.app.locals.database.getConversationById(
        concernedMessage.conversationId
      );

    if (!convernedMessageConversation)
      throw new Code500HttpError("The message hasn't a conversation parent");

    await MessageController.checkIfCurrentUserIsParticipant(
      request,
      currentUser,
      convernedMessageConversation
    );

    const reactionTypeToAdd: string = request.body.reaction;

    await request.app.locals.database.reactToMessage(
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
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedMessage: IMessage =
      await MessageController.getConcernedMessage(request);

    await MessageController.checkIfCurrentUserIsAuthor(
      request,
      currentUser,
      concernedMessage
    );

    await request.app.locals.database.deleteMessage(concernedMessage);

    response.status(200).send({
      message: {
        _id: concernedMessage.id,
      },
    });
  }

  private static async getConcernedMessage(
    request: Request
  ): Promise<IMessage> {
    const concernedMessageId: string = request.params.message_id;

    const concernedMessage: IMessage | null =
      await request.app.locals.database.getMessageById(concernedMessageId);

    if (!concernedMessage)
      throw new Code404HttpError(
        "This message id passed to the parameters doesn't exist"
      );

    return concernedMessage;
  }

  private static async checkIfCurrentUserIsAuthor(
    request: Request,
    currentUser: IUser,
    concernedMessage: IMessage
  ): Promise<void> {
    const currentUserIsAuthor =
      await request.app.locals.database.checkIfUserIsMessageAuthor(
        currentUser,
        concernedMessage
      );

    if (!currentUserIsAuthor)
      throw new Code401HttpError(
        "You can't modify this message because you are not the author of it"
      );
  }

  private static async checkIfCurrentUserIsParticipant(
    request: Request,
    currentUser: IUser,
    concernedConversation: IConversation
  ): Promise<void> {
    const currentUserIsParticipant =
      await request.app.locals.database.checkIfUserIsConversationParticipant(
        currentUser,
        concernedConversation
      );

    if (!currentUserIsParticipant)
      throw new Code401HttpError(
        "You can't modify this conversation because you are not a participant of it"
      );
  }
}
