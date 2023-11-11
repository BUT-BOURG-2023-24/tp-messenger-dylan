import supertest from "supertest";
import { Application } from "express";
import { setup, teardown } from "./setupTests";
import { IUser } from "../database/models/UserModel";

describe("CONVERSATIONS", () => {
  let app: Application,
    testUserToken: string,
    testUser2Token: string,
    testUser2: IUser,
    testUser3Token: string;

  beforeAll(async () => {
    const setupResult = await setup();

    app = setupResult.app;
    testUserToken = setupResult.testUserToken;
    testUser2Token = setupResult.testUser2Token;
    testUser2 = setupResult.testUser2;
    testUser3Token = setupResult.testUser3Token;
  });

  afterAll(async () => {
    await teardown();
  });

  test("CREATE Conversation success", async () => {
    const response = await supertest(app)
      .post("/conversations")
      .send({
        concernedUsersIds: [testUser2._id],
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(200);
  });

  test("CREATE Conversation success with false users", async () => {
    const response = await supertest(app)
      .post("/conversations")
      .send({
        concernedUsersIds: ["654f86988b3dbc7ac03790a5"],
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(400);
  });

  test("CREATE Conversation wrong users", async () => {
    const response = await supertest(app)
      .post("/conversations")
      .send({
        concernedUsersIds: ["fauxId"],
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(400);
  });

  let conversationIdToUseForNextTest: string = "";

  test("GET All conversation success", async () => {
    const response = await supertest(app)
      .get("/conversations")
      .send()
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(200);

    conversationIdToUseForNextTest = response.body.conversations[0]._id;
  });

  let messageIdToUseForNextTest: string = "";

  test("POST Message in conversation", async () => {
    const response = await supertest(app)
      .post(`/conversations/${conversationIdToUseForNextTest}`)
      .send({
        messageContent: "Salut !!",
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(200);

    messageIdToUseForNextTest = response.body.message._id;
  });

  test("POST Message in conversation with an user that doesn't a participant", async () => {
    const response = await supertest(app)
      .post(`/conversations/${conversationIdToUseForNextTest}`)
      .send({
        messageContent: "Salut !!!",
      })
      .set("authorization", testUser3Token);

    expect(response.statusCode).toBe(401);
  });

  let message2IdToUseForNextTest: string = "";

  test("POST Reply message in conversation", async () => {
    const response = await supertest(app)
      .post(`/conversations/${conversationIdToUseForNextTest}`)
      .send({
        messageContent: "Salut toi !!",
        messageReplyId: messageIdToUseForNextTest,
      })
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(200);

    message2IdToUseForNextTest = response.body.message._id;
  });

  test("PUT Edit message in conversation", async () => {
    const response = await supertest(app)
      .put(`/messages/${messageIdToUseForNextTest}`)
      .send({
        newMessageContent: "Yoo !!",
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(200);
  });

  test("PUT Edit message in conversation of another user", async () => {
    const response = await supertest(app)
      .put(`/messages/${messageIdToUseForNextTest}`)
      .send({
        newMessageContent: "Yoo !!",
      })
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(401);
  });

  test("POST React message in conversation", async () => {
    const response = await supertest(app)
      .post(`/messages/${messageIdToUseForNextTest}`)
      .send({
        reaction: "HAPPY",
      })
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(200);
  });

  test("POST See conversation", async () => {
    const response = await supertest(app)
      .post(`/conversations/see/${conversationIdToUseForNextTest}`)
      .send({
        messageId: messageIdToUseForNextTest,
      })
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(200);
  });

  test("POST See conversation with an invalid message id", async () => {
    const response = await supertest(app)
      .post(`/conversations/see/${conversationIdToUseForNextTest}`)
      .send({
        messageId: "invalidmessageid",
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(400);
  });

  test("POST See conversation with an valid message id that doesn't exist", async () => {
    const response = await supertest(app)
      .post(`/conversations/see/${conversationIdToUseForNextTest}`)
      .send({
        messageId: "654f86988b3dbc7ac03790a5",
      })
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(400);
  });

  test("DELETE Message in conversation", async () => {
    const response = await supertest(app)
      .delete(`/messages/${messageIdToUseForNextTest}`)
      .send()
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(200);
  });

  test("DELETE Message in conversation of another user", async () => {
    const response = await supertest(app)
      .delete(`/messages/${messageIdToUseForNextTest}`)
      .send()
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(401);
  });

  test("DELETE Conversation", async () => {
    const response = await supertest(app)
      .delete(`/conversations/${conversationIdToUseForNextTest}`)
      .send()
      .set("authorization", testUserToken);

    expect(response.statusCode).toBe(200);
  });

  test("PUT Edit message in a deleted conversation", async () => {
    const response = await supertest(app)
      .put(`/messages/${message2IdToUseForNextTest}`)
      .send({
        newMessageContent: "Coucou !!",
      })
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(500);
  });

  test("POST React message in a deleted conversation", async () => {
    const response = await supertest(app)
      .post(`/messages/${message2IdToUseForNextTest}`)
      .send({
        reaction: "HAPPY",
      })
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(500);
  });

  test("DELETE Message in a deleted conversation", async () => {
    const response = await supertest(app)
      .delete(`/messages/${message2IdToUseForNextTest}`)
      .send()
      .set("authorization", testUser2Token);

    expect(response.statusCode).toBe(500);
  });
});
