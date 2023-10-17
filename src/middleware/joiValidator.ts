import { JoiRequestValidatorInstance } from "../JoiRequestValidator";
import { Request, Response, NextFunction } from "express";

async function joiValidator(req: Request, res: Response, next: NextFunction) 
{
	let { error } = JoiRequestValidatorInstance.validate(req);

	if(error)
		return res.status(400).send({ error });

	next();
}

export default joiValidator;

/**
 * Ce fichier contient le middleware de validation de format de requête.
 * On veut qu'il soit executé après le middleware d'authentification (si besoin)
 * Mais avant le traitement pur de la requête.
 * 
 * En cas de non validation du body, il renvoie directement le code 400, 
 * et ne provoque ainsi pas de traitement supplémentaire pour cette requête. 
 * 
 * En cas de validation, il passe au middleware suivant (qui est censé être le traitement de la requête).
 */