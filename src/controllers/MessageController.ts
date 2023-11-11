import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { checkJwtMiddleware } from "../middlewares/CheckJwtMiddleware";
import { IUser } from "../database/models/UserModel";
import { IMessage } from "../database/models/MessageModel";
import { Code500HttpError } from "../error/HttpError";
import { IConversation } from "../database/models/ConversationModel";
import { ReactionType } from "../database/models/ReactionModel";
import { joiValidatorMiddleware } from "../middlewares/JoiValidatorMiddleware";
import { newMessageContentJoiSchema } from "./joi-schema/NewMessageContentJoiSchema";
import { messageReactionAddingJoiSchema } from "./joi-schema/MessageReactionAddingJoiSchema";
import { RequestDataHelper } from "../helpers/RequestDataHelper";

export class MessageController extends Controller {
  public constructor(app: Application) {
    super(app, "/messages/");

    this.router.use(checkJwtMiddleware);

    this.router.put(
      "/:message_id",
      joiValidatorMiddleware(newMessageContentJoiSchema),
      this.encapsulate(this.updateMessage)
    );
    this.router.post(
      "/:message_id",
      joiValidatorMiddleware(messageReactionAddingJoiSchema),
      this.encapsulate(this.reactToMessage)
    );
    this.router.delete("/:message_id", this.encapsulate(this.deleteMessage));
  }

  private async updateMessage(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedMessage: IMessage =
      await RequestDataHelper.getConcernedMessage(request);

    await RequestDataHelper.checkIfCurrentUserIsAuthor(
      request,
      currentUser,
      concernedMessage
    );

    const convernedMessageConversation: IConversation | null =
      await request.app.locals.database.getConversationById(
        concernedMessage.conversationId
      );

    if (!convernedMessageConversation)
      throw new Code500HttpError("The message hasn't a conversation parent");

    const newMessageContent: string = request.body.newMessageContent;

    await request.app.locals.database.editMessage(
      concernedMessage,
      newMessageContent
    );

    request.app.locals.socketController.sendMessageCreationEvent(
      convernedMessageConversation,
      concernedMessage
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
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedMessage: IMessage =
      await RequestDataHelper.getConcernedMessage(request);

    const convernedMessageConversation: IConversation | null =
      await request.app.locals.database.getConversationById(
        concernedMessage.conversationId
      );

    if (!convernedMessageConversation)
      throw new Code500HttpError("The message hasn't a conversation parent");

    await RequestDataHelper.checkIfCurrentUserIsParticipant(
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

    request.app.locals.socketController.sendMessageReactionAddingEvent(
      convernedMessageConversation,
      concernedMessage
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
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedMessage: IMessage =
      await RequestDataHelper.getConcernedMessage(request);

    await RequestDataHelper.checkIfCurrentUserIsAuthor(
      request,
      currentUser,
      concernedMessage
    );

    const convernedMessageConversation: IConversation | null =
      await request.app.locals.database.getConversationById(
        concernedMessage.conversationId
      );

    if (!convernedMessageConversation)
      throw new Code500HttpError("The message hasn't a conversation parent");

    await request.app.locals.database.deleteMessage(concernedMessage);

    request.app.locals.socketController.sendMessageReactionAddingEvent(
      convernedMessageConversation,
      concernedMessage
    );

    response.status(200).send({
      message: {
        _id: concernedMessage.id,
      },
    });
  }
}
