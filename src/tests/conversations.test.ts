import http from "http";
import supertest from "supertest";
import { Express } from "express";
import { setup, teardown } from "./setupTests";

describe('CONVERSATIONS', () => 
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

	test("CREATE Conversation success", async () => {
		// Pour set un header avec supertest, 
		// vous pouvez utiliser la fonction .set('headerName', headerValue)
		// Après avoir fait l'appel au get() (ou post(), ect...)
	});

	test("CREATE Conversation wrong users", async () => {

	});

	test("GET All conversation success", async () => {
		//A la fin de ce test, vous pouvez récupérer l'ID de la conversation pour la suite des tests.
	});

	test("POST Message in conversation", async () => {

		//A la fin de ce test, vous pouvez récupérer l'ID du message pour la suite des tests.
	});

	test("POST Reply message in conversation", async () => {

	});

	test("PUT Edit message in conversation", async () => {

	});

	test("POST React message in conversation", async () => {
	
	});


	test("POST See conversation", async () => {

	});

	test("DELETE Message in conversation", async () => {

	});

	test("DELETE Conversation", async () => {

	});
});