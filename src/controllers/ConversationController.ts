import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { IUser } from "../database/models/UserModel";
import { checkJwtMiddleware } from "../middlewares/CheckJwtMiddleware";
import { Code400HttpError, Code404HttpError } from "../error/HttpError";
import {
  ConversationModel,
  IConversation,
} from "../database/models/ConversationModel";
import { IMessage, MessageModel } from "../database/models/MessageModel";
import { joiValidatorMiddleware } from "../middlewares/JoiValidatorMiddleware";
import { conversationCreationJoiSchema } from "./joi-schema/ConversationCreationJoiSchema";
import { seeConversationMessageJoiSchema } from "./joi-schema/SeeConversationMessageJoiSchema";
import { newConversationMessageJoiSchema } from "./joi-schema/NewConversationMessageJoiSchema";
import { RequestDataHelper } from "../helpers/RequestDataHelper";
import { isValidObjectId } from "mongoose";

export class ConversationController extends Controller {
  public constructor(app: Application) {
    super(app, "/conversations/");

    this.router.use(checkJwtMiddleware);

    this.router.post(
      "/",
      joiValidatorMiddleware(conversationCreationJoiSchema),
      this.encapsulate(this.createConversation)
    );
    this.router.get("/", this.encapsulate(this.getUserConversations));
    this.router.delete(
      "/:conversation_id",
      this.encapsulate(this.deleteConversation)
    );
    this.router.post(
      "/see/:conversation_id",
      joiValidatorMiddleware(seeConversationMessageJoiSchema),
      this.encapsulate(this.seeConversationMessage)
    );
    this.router.post(
      "/:conversation_id",
      joiValidatorMiddleware(newConversationMessageJoiSchema),
      this.encapsulate(this.sendMessage)
    );
  }

  private async createConversation(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedUsersIds: Array<string> = request.body.concernedUsersIds;

    concernedUsersIds.push(currentUser.id);

    for (const concernedUserId of concernedUsersIds) {
      const concernedUserIdIsValid: boolean = isValidObjectId(concernedUserId);

      if (!concernedUserIdIsValid)
        throw new Code400HttpError("A provided id is not a correct id");

      const concernedUser: IUser | null =
        await request.app.locals.database.getUserById(concernedUserId);

      if (!concernedUser)
        throw new Code400HttpError("A provided user doesn't exist");
    }

    const newConversation: IConversation = new ConversationModel({
      title: new Date().toLocaleString(),
      lastUpdate: new Date(),
      participants: concernedUsersIds,
      messages: new Array(),
      seen: new Array(),
    });

    await request.app.locals.database.createConversation(newConversation);

    request.app.locals.socketController.sendConversationCreationEvent(
      concernedUsersIds,
      newConversation
    );

    response.status(200).send({
      conversation: {
        _id: newConversation.id,
        title: newConversation.title,
      },
    });
  }

  private async getUserConversations(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const userConversations: Array<IConversation> =
      await request.app.locals.database.getAllConversationsForUser(currentUser);

    response.status(200).send({
      conversations: userConversations.map((userConversation) => {
        return userConversation;
      }),
    });
  }

  private async deleteConversation(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedConversation: IConversation =
      await RequestDataHelper.getConcernedConversation(request);

    await RequestDataHelper.checkIfCurrentUserIsParticipant(
      request,
      currentUser,
      concernedConversation
    );

    await request.app.locals.database.deleteConversation(concernedConversation);

    request.app.locals.socketController.sendConversationDeletingEvent(
      concernedConversation
    );

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
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedConversation: IConversation =
      await RequestDataHelper.getConcernedConversation(request);

    await RequestDataHelper.checkIfCurrentUserIsParticipant(
      request,
      currentUser,
      concernedConversation
    );

    const messageIdToSee: string = request.body.messageId;

    const messageIdToSeeIsValid: boolean = isValidObjectId(messageIdToSee);

    if (!messageIdToSeeIsValid)
      throw new Code400HttpError("The message id is not valid");

    const messageToSee: IMessage | null =
      await request.app.locals.database.getMessageById(messageIdToSee);

    if (!messageToSee)
      throw new Code400HttpError(
        "This message passed to the body doesn't exist"
      );

    await request.app.locals.database.setConversationSeenForUserAndMessage(
      concernedConversation,
      currentUser,
      messageToSee
    );

    request.app.locals.socketController.sendConversationSeenEvent(
      concernedConversation
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
    const currentUser: IUser = RequestDataHelper.getCurrentUser(request);

    const concernedConversation: IConversation =
      await RequestDataHelper.getConcernedConversation(request);

    await RequestDataHelper.checkIfCurrentUserIsParticipant(
      request,
      currentUser,
      concernedConversation
    );

    const messageReplyId: string | undefined = request.body.messageReplyId;

    const newMessage: IMessage = new MessageModel({
      from: currentUser,
      replyTo: messageReplyId,
      content: request.body.messageContent,
      postedAt: new Date(),
      edited: false,
      deleted: false,
      reactions: new Array(),
    });

    await request.app.locals.database.addMessageToConversation(
      concernedConversation,
      newMessage
    );

    request.app.locals.socketController.sendMessageCreationEvent(
      concernedConversation,
      newMessage
    );

    response.status(200).send({
      message: {
        _id: newMessage.id,
      },
    });
  }
}
