import http from "http";
import { Express } from "express";
import { setup, teardown } from "./setupTests";
import supertest from "supertest";

describe('USERS', () => 
{
	let app:Express, server:http.Server;

	beforeAll(async () => {
		let res = await setup();
		app = res.app; 
		server = res.server;
	});

	afterAll(async () => {
		await teardown();
	});

	test("Login unexisting user", async () => {

	});

	test("Login existing user", async () => {

	});

	test("Login wrong password", async () => {

	});

	test("GET active users", async () => {

	});
});