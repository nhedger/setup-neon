import { chmodSync } from "node:fs";
import { symlink } from "node:fs/promises";
import { dirname } from "node:path";
import { join } from "node:path";
import { addPath, setFailed } from "@actions/core";
import { downloadTool } from "@actions/tool-cache";
import { RequestError } from "@octokit/request-error";
import { Octokit } from "@octokit/rest";

/**
 * Neon Setup Options
 */
export interface SetupOptions {
	/**
	 * Version of the Neon CLI to download
	 */
	version?: string;

	/**
	 * Operating system to download the CLI for
	 */
	platform: "linux" | "darwin" | "win32";

	/**
	 * Octokit instance to use for API calls
	 */
	octokit: Octokit;
}

const defaultOptions: SetupOptions = {
	version: "latest",
	platform: process.platform as "linux" | "darwin" | "win32",
	octokit: new Octokit(),
};

export const setup = async (config: Partial<SetupOptions>) => {
	const options: SetupOptions = { ...defaultOptions, ...config };

	try {
		// Download the Neon CLI
		const executablePath = await download(options);

		// Install the Neon CLI
		await install(executablePath, options);
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log(error.message);
			setFailed(error.message);
		}
	}
};

/**
 * Downloads the Neon CLI
 */
const download = async (options: SetupOptions): Promise<string> => {
	try {
		const releaseId = await findRelease(options);
		const assetURL = await findAsset(releaseId, options);
		console.log(assetURL);
		return await downloadTool(assetURL);
	} catch (error) {
		if (error instanceof RequestError) {
			const requestError = error as RequestError;
			if (
				requestError.status === 403 &&
				requestError.response?.headers["x-ratelimit-remaining"] === "0"
			) {
				throw new Error(`
                    You have exceeded the GitHub API rate limit.
                    Please try again in ${requestError.response?.headers["x-ratelimit-reset"]} seconds.
                    If you have not already done so, you can try authenticating calls to the GitHub API
                    by setting the \`GITHUB_TOKEN\` environment variable.
                `);
			}
		}
		throw error;
	}
};

/**
 * Finds the release for the given version
 */
const findRelease = async (options: SetupOptions) => {
	try {
		if (options.version === "latest") {
			return (
				await options.octokit.repos.getLatestRelease({
					owner: "neondatabase",
					repo: "neonctl",
				})
			).data.id;
		}

		return (
			await options.octokit.repos.getReleaseByTag({
				owner: "neondatabase",
				repo: "neonctl",
				tag: `v${options.version}`,
			})
		).data.id;
	} catch (error) {
		if (error instanceof RequestError) {
			const requestError = error as RequestError;
			if (requestError.status === 404) {
				throw new Error(
					`Version ${options.version} of the Neon CLI does not exist.`,
				);
			}
			throw error;
		}
		throw error;
	}
};

/**
 * Finds the asset for the given release ID and options
 */
const findAsset = async (releaseId: number, options: SetupOptions) => {
	const assets = await options.octokit.paginate(
		"GET /repos/{owner}/{repo}/releases/{release_id}/assets",
		{
			owner: "neondatabase",
			repo: "neonctl",
			release_id: releaseId,
		},
	);

	const patterns: Map<string, string> = new Map([
		["linux", "neonctl-linux-x64"],
		["darwin", "neonctl-macos-x64"],
		["win32", "neonctl-win-x64.exe"],
	]);

	console.log(assets);

	const asset = assets.find((asset) =>
		asset.name.endsWith(
			patterns.get(options.platform) as SetupOptions["platform"],
		),
	);

	if (!asset) {
		throw new Error(
			`Could not find a Neon CLI release for ${options.platform} for the given version.`,
		);
	}

	return asset.browser_download_url;
};

/**
 * Installs the downloaded Neon CLI
 */
const install = async (executablePath: string, options: SetupOptions) => {
	// Find parent directory of executable
	const parentDir = dirname(executablePath);
	console.log("parentDir", parentDir);

	// Symlink the executable to "neon" and "neonctl", and make executable
	await symlink(executablePath, join(parentDir, "neon"));
	chmodSync(join(parentDir, "neon"), 0o755);
	console.log("neon", join(parentDir, "neon"));

	await symlink(executablePath, join(parentDir, "neonctl"));
	chmodSync(join(parentDir, "neonctl"), 0o755);
	console.log("neonctl", join(parentDir, "neonctl"));

	// Add the parent directory to the PATH
	addPath(parentDir);
};
