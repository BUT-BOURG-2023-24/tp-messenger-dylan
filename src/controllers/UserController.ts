import { Application, Request, Response } from "express";
import { Controller } from "./Controller";
import { IUser, UserModel } from "../database/models/UserModel";
import { pickRandom } from "../pictures";
import { TokenHelper } from "../helpers/TokenHelper";
import { compare } from "bcrypt";
import { Code400HttpError, Code401HttpError } from "../error/HttpError";
import { joiValidatorMiddleware } from "../middlewares/JoiValidatorMiddleware";
import { userLoginJoiSchema } from "./joi-schema/UserLoginJoiSchema";

export class UserController extends Controller {
  public constructor(app: Application) {
    super(app, "/users/");

    this.router.post(
      "/login",
      joiValidatorMiddleware(userLoginJoiSchema),
      this.encapsulate(this.login)
    );
    this.router.get("/online", this.encapsulate(this.getOnlineUsers));
    this.router.get("/all", this.encapsulate(this.getAllUsers));
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
        throw new Code400HttpError("The password is invalid");

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
        user: newUser,
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

    for (const entry of request.app.locals.socketController.userIdSocketIdMap) {
      const userId: string = entry[0];

      onlineUserIds.push(userId);
    }

    const onlineUsers: Array<IUser> =
      await request.app.locals.database.getUsersByIds(onlineUserIds);

    response.status(200).send({
      users: onlineUsers,
    });
  }

  private async getAllUsers(
    request: Request,
    response: Response
  ): Promise<void> {
    const allUsers: Array<IUser> =
      await request.app.locals.database.getAllUsers();

    response.status(200).send({
      users: allUsers,
    });
  }
}
