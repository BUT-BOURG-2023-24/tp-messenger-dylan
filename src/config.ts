import * as dotenv from "dotenv";

dotenv.config();

export default {
  DB_ADDRESS: process.env.DB_ADDRESS ?? "localhost:27017",
  DB_ADDRESS_TEST: process.env.DB_ADDRESS_TEST ?? "",
  DB_NAME: process.env.DB_NAME ?? "messenger",
  PORT: process.env.PORT ?? 5000,
  JWT_SECRET: process.env.JWT_SECRET ?? "secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1h",
};

/**
 * Ce fichier permet d'avoir un accès direct aux variables situées dans le .env,
 * sans avoir à appeler process.env.
 * Une initialisation des variables sera faites même si les variables ne sont pas dans le .env
 * pour que l'appli puisse tourner.
 *
 * Vous êtes libre de modifier ce fichier comme vous le souhaitez.
 **/
