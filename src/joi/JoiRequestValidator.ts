import * as joi from "joi";
import { Request } from "express";
import { userLoginJoiSchema } from "./joi-schema/UserLoginJoiSchema";
import { conversationCreationJoiSchema } from "./joi-schema/ConversationCreationJoiSchema";
import { seeConversationMessageJoiSchema } from "./joi-schema/SeeConversationMessageJoiSchema";
import { newConversationMessageJoiSchema } from "./joi-schema/NewConversationMessageJoiSchema";

interface JoiRequestValidatorResponse {
  error?: string;
}

interface JoiRouteValidator {
  route: string;
  method: string;
  validatorSchema: joi.ObjectSchema<any>;
}

class JoiRequestValidator {
  validators: JoiRouteValidator[] = [
    {
      route: "/users/login",
      method: "POST",
      validatorSchema: userLoginJoiSchema,
    },
    {
      route: "/conversations",
      method: "POST",
      validatorSchema: conversationCreationJoiSchema,
    },
    {
      route: "/conversations/see/:conversation_id",
      method: "POST",
      validatorSchema: seeConversationMessageJoiSchema,
    },
    {
      route: "/conversations/:conversation_id",
      method: "POST",
      validatorSchema: newConversationMessageJoiSchema,
    },
  ];

  validate(request: Request): JoiRequestValidatorResponse {
    // request.baseUrl contient l'URL de base, avant application des middlewares.
    // request.route.path contient l'URL que vous déclarez dans votre middleware de routage.
    console.log(request.baseUrl);
    console.log(request.route.path);

    /* 
			ETAPE 1:

			Trouver dans la liste de validators, le validator qui correspond à la route de la requête.
		*/

    /* 
			ETAPE 2:

			Si le validator n'existe pas
				=> retourner un objet vide.
			Si le validator existe 
				=> valider le body de la requête.
				=> Si le body est valide
					=> retourner un objet vide.
				=> Si le body est invalide
					=> retourner un objet avec une clé error contenant les details de l'erreur.
		*/
    return {};
  }
}

export const JoiRequestValidatorInstance = new JoiRequestValidator();
