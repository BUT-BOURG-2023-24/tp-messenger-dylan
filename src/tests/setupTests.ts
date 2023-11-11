require("ts-node/register");
import http from "http";
import supertest from "supertest";
import { Application } from "express";
import mongoose from "mongoose";
import { Database } from "../database/Database";
import { makeApp } from "../app";
import { IUser } from "../database/models/UserModel";

interface SetupResult {
  server: http.Server;
  app: Application;
  testUserToken: string;
  testUser: IUser;
  testUser2Token: string;
  testUser2: IUser;
  testUser3Token: string;
  testUser3: IUser;
}

async function setup(): Promise<SetupResult> {
  const database = new Database(true);

  await database.connect();

  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }

  const { app, server } = makeApp(database);

  const userCreationResponse1 = await supertest(app)
    .post("/users/login")
    .send({ username: "test1", password: "testpwd" });

  const userCreationResponse2 = await supertest(app)
    .post("/users/login")
    .send({ username: "test2", password: "testpwd" });

  const userCreationResponse3 = await supertest(app)
    .post("/users/login")
    .send({ username: "test3", password: "testpwd" });

  await supertest(app)
    .post("/conversations")
    .send({
      concernedUsersIds: [
        userCreationResponse1.body.user._id,
        userCreationResponse2.body.user._id,
      ],
    });

  const testUserToken: string = userCreationResponse1.body.token;
  const testUser: IUser = userCreationResponse1.body.user;

  const testUser2Token: string = userCreationResponse2.body.token;
  const testUser2: IUser = userCreationResponse2.body.user;

  const testUser3Token: string = userCreationResponse3.body.token;
  const testUser3: IUser = userCreationResponse3.body.user;

  return {
    app,
    server,
    testUserToken,
    testUser,
    testUser2Token,
    testUser2,
    testUser3Token,
    testUser3,
  };
}

async function teardown() {
  await mongoose.disconnect();
}

export { setup, teardown };
