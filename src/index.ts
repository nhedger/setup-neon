import { createActionAuth } from "@octokit/auth-action";
import { Octokit } from "@octokit/rest";
import { getInput } from "./helpers";
import { setup } from "./setup";

(async () => {
	await setup({
		version: getInput("version"),
		platform: process.platform as "linux" | "darwin" | "win32",
		octokit: new Octokit({
			auth: (await createActionAuth()()).token,
		}),
	});
})();
