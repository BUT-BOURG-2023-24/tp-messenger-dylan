import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { IUser, UserModel } from "../database/models/UserModel";
import { pickRandom } from "../pictures";
import { TokenHelper } from "../helpers/TokenHelper";
import { checkJwtMiddleware } from "../middlewares/CheckJwtMiddleware";
import { compare } from "bcrypt";
import { Code401HttpError } from "../error/HttpError";
import { joiValidatorMiddleware } from "../middlewares/JoiValidatorMiddleware";
import { userLoginJoiSchema } from "./joi-schema/UserLoginJoiSchema";

export class UserController extends Controller {
  public constructor(app: Application) {
    super(app, "/users/");

    this.router.post(
      "/login",
      joiValidatorMiddleware(userLoginJoiSchema),
      this.login
    );
    this.router.get("/online", checkJwtMiddleware, this.getOnlineUsers);
  }

  private async login(request: Request, response: Response): Promise<void> {
    const currentUser: IUser | null =
      await request.app.locals.database.getUserByName(request.body.username);

    if (currentUser) {
      const passwordIsValid: boolean = await compare(
        request.body.password,
        currentUser.password
      );

      if (!passwordIsValid)
        throw new Code401HttpError("The password is invalid");

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

      await request.app.locals.database.createUser(newUser);

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
    request: Request,
    response: Response
  ): Promise<void> {
    const onlineUserIds: Array<string> = new Array();

    for (const entry of request.app.locals.socketController.socketIdUserIdMap) {
      const userId: string = entry[0];

      onlineUserIds.push(userId);
    }

    const onlineUsers: Array<IUser> =
      await request.app.locals.database.getUsersByIds(onlineUserIds);

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
