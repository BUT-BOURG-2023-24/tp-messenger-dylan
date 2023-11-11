import { Database } from "../database/Database";
import { Server, Socket } from "socket.io";
import { IUser } from "../database/models/UserModel";
import { IConversation } from "../database/models/ConversationModel";
import { IMessage } from "../database/models/MessageModel";

export class SocketController {
  public readonly userIdSocketIdMap = new Map<string, string>();

  public constructor(
    private readonly io: Server,
    private readonly database: Database
  ) {
    this.connect();
    this.listenRoomChanged();
  }

  private connect(): void {
    this.io.on("connection", async (connectedSocket: Socket) => {
      const currentUser: IUser | undefined = await this.getSocketUser(
        connectedSocket
      );

      if (!currentUser) return;

      await this.handleConnection(connectedSocket, currentUser);

      connectedSocket.on("disconnect", () => {
        this.handleDeconnection(connectedSocket, currentUser);
      });
    });
  }

  private async handleConnection(
    connectedSocket: Socket,
    currentUser: IUser
  ): Promise<void> {
    this.linkUserIdSocketId(connectedSocket, currentUser.id);

    const userConversations: Array<IConversation> =
      await this.database.getAllConversationsForUser(currentUser);

    for (const conversation of userConversations) {
      connectedSocket.join(conversation.id);
    }

    connectedSocket.broadcast.emit("@onConnected", {
      userId: currentUser.id,
    });
  }

  private async handleDeconnection(
    connectedSocket: Socket,
    currentUser: IUser
  ): Promise<void> {
    connectedSocket.broadcast.emit("@onDisconnected", {
      userId: currentUser.id,
    });
  }

  private getUserId(connectedSocket: Socket): string | undefined {
    return connectedSocket.handshake.headers.userid as string | undefined;
  }

  private linkUserIdSocketId(socket: Socket, userId: string): void {
    this.userIdSocketIdMap.set(userId, socket.id);

    socket.on("disconnect", () => {
      this.userIdSocketIdMap.delete(userId);
    });
  }

  private async getSocketUser(socket: Socket): Promise<IUser | undefined> {
    const currentUserId: string | undefined = this.getUserId(socket);

    if (!currentUserId) return undefined;

    const currentUser: IUser | null = await this.database.getUserById(
      currentUserId
    );

    return currentUser ?? undefined;
  }

  public sendConversationCreationEvent(
    concernedUserIds: Array<string>,
    conversation: IConversation
  ): void {
    for (const concernedUserId of concernedUserIds) {
      const concernedUserSocketId: string | undefined =
        this.userIdSocketIdMap.get(concernedUserId);

      if (!concernedUserSocketId) continue;

      const concernedUserSocket: Socket | undefined =
        this.io.sockets.sockets.get(concernedUserSocketId);

      if (!concernedUserSocket) continue;

      concernedUserSocket.join(conversation.id);
    }

    this.io.to(conversation.id).emit("@newConversation", {
      conversation: {
        _id: conversation.id,
      },
    });
  }

  public sendConversationDeletingEvent(conversation: IConversation): void {
    this.io.to(conversation.id).emit("@conversationDeleted", {
      conversation: {
        _id: conversation.id,
      },
    });
  }

  public sendConversationSeenEvent(conversation: IConversation): void {
    this.io.to(conversation.id).emit("@conversationSeen", {
      conversation: {
        _id: conversation.id,
      },
    });
  }

  public sendMessageCreationEvent(
    conversation: IConversation,
    message: IMessage
  ): void {
    this.io.to(conversation.id).emit("@newMessage", {
      message: {
        _id: message.id,
      },
    });
  }

  public sendMessageEditingEvent(
    conversation: IConversation,
    message: IMessage
  ): void {
    this.io.to(conversation.id).emit("@messageEdited", {
      message: {
        _id: message.id,
      },
    });
  }

  public sendMessageReactionAddingEvent(
    conversation: IConversation,
    message: IMessage
  ): void {
    this.io.to(conversation.id).emit("@reactionAdded", {
      message: {
        _id: message.id,
      },
    });
  }

  public sendMessageDeletingEvent(
    conversation: IConversation,
    message: IMessage
  ): void {
    this.io.to(conversation.id).emit("@messageDeleted", {
      message: {
        _id: message.id,
      },
    });
  }

  // Cette fonction vous sert juste de debug.
  // Elle permet de log l'informations pour chaque changement d'une room.
  listenRoomChanged() {
    this.io.of("/").adapter.on("create-room", (room) => {
      console.log(`room ${room} was created`);
    });

    this.io.of("/").adapter.on("join-room", (room, id) => {
      console.log(`socket ${id} has joined room ${room}`);
    });

    this.io.of("/").adapter.on("leave-room", (room, id) => {
      console.log(`socket ${id} has leave room ${room}`);
    });

    this.io.of("/").adapter.on("delete-room", (room) => {
      console.log(`room ${room} was deleted`);
    });
  }
}
