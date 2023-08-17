import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";

export class GitHub {

	/**
	 * @param {string} auth - GitHub PAT
	 * @param {boolean=} throttled
	 * @returns {GitHub}
	 */
	static fromToken(auth, throttled = true) {
		return new GitHub(new (Octokit.plugin(throttling))({
			auth,
			throttle: {
				enabled: throttled,
				onRateLimit: retry(3),
				onSecondaryRateLimit: retry(3),
			},
		}));
	}

	/**
	 * @param {Octokit} service
	 */
	constructor(service) {
		this.service = service;
	}

	/**
	 * @param {string} username
	 * @returns {Promise<boolean>}
	 */
	async validUsername(username) {
		try {
			const { data: { items } } = await this.service.search.users({ q: `user:${username}` });
			return items.find(({ login }) => login === username) !== undefined;
		} catch (/** @type {any} */err) {
			if (err.status === 422) {
				return false;
			}
			throw err;
		}
	}
}

/**
 * @param {number} attempts
 * @returns {(retryAfter: number, options: unknown, octokit: unknown, retryCount: number) => boolean}
 */
function retry(attempts) {
	return (_, __, ___, retryCount) => retryCount < (attempts - 1);
}
