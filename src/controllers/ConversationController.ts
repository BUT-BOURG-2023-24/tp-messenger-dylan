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
    super(app, "/conversations/");

    this.router.use(checkJwtMiddleware);

    this.router.post("/", this.createConversation);
    this.router.get("/", this.getUserConversations);
    this.router.delete("/:conversation_id", this.deleteConversation);
    this.router.post("/see/:conversation_id", this.seeConversationMessage);
    this.router.post("/:conversation_id", this.sendMessage);
  }

  private async createConversation(
    request: Request,
    response: Response
  ): Promise<void> {
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedUsersIds: Array<string> = request.body.concernedUsersIds;

    concernedUsersIds.push(currentUser.id);

    const newConversation: IConversation = new ConversationModel({
      title: new Date().toLocaleString(),
      lastUpdate: new Date(),
      participants: concernedUsersIds,
      messages: new Array(),
      seen: new Array(),
    });

    await request.app.locals.database.createConversation(newConversation);

    request.app.locals.socketController.sendConversationCreationEvent(
      newConversation
    );

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
    const currentUser: IUser = Controller.getCurrentUser(request);

    const userConversations: Array<IConversation> =
      await request.app.locals.database.getAllConversationsForUser(currentUser);

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
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedConversation: IConversation =
      await ConversationController.getConvernedConversation(request);

    await ConversationController.checkIfCurrentUserIsParticipant(
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
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedConversation: IConversation =
      await ConversationController.getConvernedConversation(request);

    await ConversationController.checkIfCurrentUserIsParticipant(
      request,
      currentUser,
      concernedConversation
    );

    const messageIdToSee: string = request.body.messageId;

    const messageToSee: IMessage | null =
      await request.app.locals.database.getMessageById(messageIdToSee);

    if (!messageToSee)
      throw new Code404HttpError(
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
    const currentUser: IUser = Controller.getCurrentUser(request);

    const concernedConversation: IConversation =
      await ConversationController.getConvernedConversation(request);

    await ConversationController.checkIfCurrentUserIsParticipant(
      request,
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

    await request.app.locals.database.addMessageToConversation(
      concernedConversation,
      newMessage
    );

    response.status(200).send({
      conversation: {
        _id: concernedConversation.id,
      },
    });
  }

  private static async getConvernedConversation(
    request: Request
  ): Promise<IConversation> {
    const concernedConversationId: string = request.params.conversation_id;

    const concernedConversation: IConversation | null =
      await request.app.locals.database.getConversationById(
        concernedConversationId
      );

    if (!concernedConversation)
      throw new Code404HttpError(
        "This conversation passed to the parameters doesn't exist"
      );

    return concernedConversation;
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
