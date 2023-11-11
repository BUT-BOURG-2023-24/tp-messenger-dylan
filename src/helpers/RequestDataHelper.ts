import { Request } from "express";
import { IUser } from "../database/models/UserModel";
import {
  Code400HttpError,
  Code401HttpError,
  Code404HttpError,
  Code500HttpError,
} from "../error/HttpError";
import { IConversation } from "../database/models/ConversationModel";
import { IMessage } from "../database/models/MessageModel";
import { isValidObjectId } from "mongoose";

export class RequestDataHelper {
  public static getCurrentUser(request: Request): IUser {
    const currentUser: IUser | undefined = request.currentUser;

    if (!currentUser)
      throw new Code500HttpError("The CheckJwtMiddleware doesn't work");

    return currentUser;
  }

  public static async getConcernedConversation(
    request: Request
  ): Promise<IConversation> {
    const concernedConversationId: string = request.params.conversation_id;

    const concernedConversationIdIsValid: boolean = isValidObjectId(
      concernedConversationId
    );

    if (!concernedConversationIdIsValid)
      throw new Code400HttpError("The provided conversation id is not valid");

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

  public static async checkIfCurrentUserIsParticipant(
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

  public static async getConcernedMessage(request: Request): Promise<IMessage> {
    const concernedMessageId: string = request.params.message_id;

    const concernedMessageIdIsValid: boolean =
      isValidObjectId(concernedMessageId);

    if (!concernedMessageIdIsValid)
      throw new Code400HttpError("The provided message id is not valid");

    const concernedMessage: IMessage | null =
      await request.app.locals.database.getMessageById(concernedMessageId);

    if (!concernedMessage)
      throw new Code404HttpError(
        "This message id passed to the parameters doesn't exist"
      );

    return concernedMessage;
  }

  public static async checkIfCurrentUserIsAuthor(
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
}
