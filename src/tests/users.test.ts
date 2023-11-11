import { Application } from "express";
import { setup, teardown } from "./setupTests";
import supertest from "supertest";

describe("USERS", () => {
  let app: Application;

  beforeAll(async () => {
    const setupResult = await setup();

    app = setupResult.app;
  });

  afterAll(async () => {
    await teardown();
  });

  test("Login unexisting user", async () => {
    const response = await supertest(app).post("/users/login").send({
      username: "testexist",
      password: "hehe45",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.isNewUser).toBeTruthy();
  });

  test("Login existing user", async () => {
    const response = await supertest(app).post("/users/login").send({
      username: "test2",
      password: "testpwd",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.isNewUser).toBeFalsy();
  });

  test("Login wrong password", async () => {
    const response = await supertest(app).post("/users/login").send({
      username: "test2",
      password: "mauvaismdp",
    });

    expect(response.statusCode).toBe(400);
  });

  test("GET active users", async () => {
    const response = await supertest(app).get("/users/online").send();

    expect(response.statusCode).toBe(200);
    expect(response.body.users).toHaveLength(0);
  });

  test("GET all users", async () => {
    const response = await supertest(app).get("/users/all").send();

    expect(response.statusCode).toBe(200);
    expect(response.body.users).toHaveLength(4);
  });
});
