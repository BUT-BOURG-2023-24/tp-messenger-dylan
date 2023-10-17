import config from "../config";

class Database 
{
	fromTest: boolean;

	constructor(fromTest: boolean) 
	{
		this.fromTest = fromTest;
	}
	
	async connect()
	{
		// config.DB_ADDRESS contient l'adresse de la BDD
	}
}

export default Database;
export type { Database };
