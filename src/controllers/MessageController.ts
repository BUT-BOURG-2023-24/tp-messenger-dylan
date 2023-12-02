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
import { RequestDataHelper } from "../helpers/RequestDataHelper";
import { messageReactionJoiSchema } from "./joi-schema/MessageReactionJoiSchema";

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
      joiValidatorMiddleware(messageReactionJoiSchema),
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

    await request.app.locals.database.updateConversation(
      convernedMessageConversation
    );

    request.app.locals.socketController.sendMessageCreationEvent(
      convernedMessageConversation,
      concernedMessage
    );

    response.status(200).send({
      message: concernedMessage,
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

    const reactionTypeToAdd: ReactionType | undefined = request.body.reaction;

    await request.app.locals.database.reactToMessage(
      concernedMessage,
      currentUser,
      reactionTypeToAdd
    );

    await request.app.locals.database.updateConversation(
      convernedMessageConversation
    );

    request.app.locals.socketController.sendMessageReactionAddingEvent(
      convernedMessageConversation,
      concernedMessage
    );

    response.status(200).send({
      message: concernedMessage,
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
    await request.app.locals.database.updateConversation(
      convernedMessageConversation
    );

    request.app.locals.socketController.sendMessageDeletingEvent(
      convernedMessageConversation,
      concernedMessage
    );

    response.status(200).send({
      message: concernedMessage,
    });
  }
}
