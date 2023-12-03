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
      user: currentUser,
    });
  }

  private async handleDeconnection(
    connectedSocket: Socket,
    currentUser: IUser
  ): Promise<void> {
    connectedSocket.broadcast.emit("@onDisconnected", {
      user: currentUser,
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

  public getSocket(socketId: string): Socket | undefined {
    return this.io.sockets.sockets.get(socketId);
  }

  public sendConversationCreationEvent(
    concernedUserIds: Array<string>,
    conversation: IConversation,
    socketThatTriggers?: Socket
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

    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@newConversation", {
      conversation: conversation,
    });
  }

  public sendConversationDeletingEvent(
    conversation: IConversation,
    socketThatTriggers?: Socket
  ): void {
    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@conversationDeleted", {
      conversation: conversation,
    });
  }

  public sendConversationSeenEvent(
    conversation: IConversation,
    socketThatTriggers?: Socket
  ): void {
    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@conversationSeen", {
      conversation: conversation,
    });
  }

  public sendMessageCreationEvent(
    conversation: IConversation,
    message: IMessage,
    socketThatTriggers?: Socket
  ): void {
    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@newMessage", {
      message: message,
    });
  }

  public sendMessageEditingEvent(
    conversation: IConversation,
    message: IMessage,
    socketThatTriggers?: Socket
  ): void {
    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@messageEdited", {
      message: message,
    });
  }

  public sendMessageReactionAddingEvent(
    conversation: IConversation,
    message: IMessage,
    socketThatTriggers?: Socket
  ): void {
    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@reactionAdded", {
      message: message,
    });
  }

  public sendMessageDeletingEvent(
    conversation: IConversation,
    message: IMessage,
    socketThatTriggers?: Socket
  ): void {
    const broadcastToUse = socketThatTriggers?.broadcast ?? this.io.sockets;

    broadcastToUse.to(conversation.id).emit("@messageDeleted", {
      message: message,
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
