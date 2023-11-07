import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { IUser, UserModel } from "../database/models/UserModel";
import { pickRandom } from "../pictures";
import { TokenHelper } from "../helpers/TokenHelper";
import { checkJwtMiddleware } from "../middlewares/CheckJwtMiddleware";

export class UserController extends Controller {
  public constructor(app: Application) {
    super(app, "users");

    this.router.post("login", this.login);
    this.router.get("online", checkJwtMiddleware, this.getOnlineUsers);
  }

  private async login(request: Request, response: Response): Promise<void> {
    const currentUser: IUser | null = await this.database.getUserByName(
      request.body.username
    );

    if (currentUser) {
      const userToken: string = TokenHelper.generateUserToken(currentUser.id);

      response.status(200).send({
        user: {
          _id: currentUser.id,
        },
        token: userToken,
        isNewUser: false,
      });
    } else {
      const newUser: IUser = new UserModel({
        username: request.body.username,
        password: request.body.password,
        profilePicId: pickRandom(),
      });

      await this.database.createUser(newUser);

      const userToken: string = TokenHelper.generateUserToken(newUser.id);

      response.status(200).send({
        user: {
          _id: newUser.id,
        },
        token: userToken,
        isNewUser: true,
      });
    }
  }

  private async getOnlineUsers(
    _request: Request,
    response: Response
  ): Promise<void> {
    const onlineUserIds: Array<string> = new Array();

    for (const entry of this.socketController.socketIdUserIdMap) {
      const userId: string = entry[0];

      onlineUserIds.push(userId);
    }

    const onlineUsers: Array<IUser> = await this.database.getUsersByIds(
      onlineUserIds
    );

    response.status(200).send({
      users: onlineUsers.map((onlineUser) => {
        return {
          _id: onlineUser.id,
          username: onlineUser.username,
        };
      }),
    });
  }
}
