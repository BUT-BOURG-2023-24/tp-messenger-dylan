import { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	setupFiles: ["dotenv/config"],
	moduleDirectories: ["./node_modules", "./src"],
};

export default config;