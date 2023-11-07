import { Database } from "../database/Database";
import { Server, Socket } from "socket.io";
import { TokenHelper } from "../helpers/TokenHelper";
import { IUser } from "../database/models/UserModel";
import { IConversation } from "../database/models/ConversationModel";

export class SocketController {
  /*
		Pour savoir si un utilisateur est connecté depuis la route /online,
		Nous devons stocker une correspondance socketId <=> userId.
	*/

  public readonly socketIdUserIdMap = new Map<string, string>();

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

      // Récupérer les infos voulu depuis les extra headers.
      // socket.handshake.headers contient ce que vous voulez.
      /*
				Dès qu'un socket utilisateur arrive, on veut l'ajouter à la room
				pour chaque conversation dans laquelle il se trouve. 

				ETAPE 1: 
					Trouver toutes les conversations ou participe l'utilisateur. 

				ETAPE 2:
					Rejoindre chaque room ayant pour nom l'ID de la conversation. 

				HINT:
					socket.join(roomName: string) permet de rejoindre une room.
					Le paramètre roomName doit absolument être de type string,
					si vous mettez un type number, cela ne fonctionnera pas.
			*/
    });
  }

  private async handleConnection(
    connectedSocket: Socket,
    currentUser: IUser
  ): Promise<void> {
    this.linkSocketIdUserId(connectedSocket, currentUser.id);

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
    const userToken: string | undefined =
      connectedSocket.handshake.headers.authorization;

    if (!userToken) return;

    let userTokenPayload = TokenHelper.decodeUserToken(userToken);

    if (!userTokenPayload.sub || typeof userTokenPayload.sub !== "string")
      return undefined;

    return userTokenPayload.sub;
  }

  private linkSocketIdUserId(socket: Socket, userId: string): void {
    this.socketIdUserIdMap.set(socket.id, userId);

    socket.on("disconnect", () => {
      this.socketIdUserIdMap.delete(socket.id);
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

  public sendConversationCreationEvent(conversation: IConversation): void {
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
