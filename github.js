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
	 * @param {Date} start
	 * @param {Date} end
	 * @returns {Promise<number>}
	 */
	async commitsBetween(username, start, end) {
		const { data: { total_count } } = await this.service.search.commits({
			q: `author:${username} author-date:${this._toISODate(start)}..${this._toISODate(end)}`,
		});
		return total_count;
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

	/**
	 * @param {Date} date
	 * @returns {string}
	 */
	_toISODate(date) {
		return date.toISOString().slice(0, 10);
	}
}

/**
 * @param {number} attempts
 * @returns {(retryAfter: number, options: unknown, octokit: unknown, retryCount: number) => boolean}
 */
function retry(attempts) {
	return (_, __, ___, retryCount) => retryCount < (attempts - 1);
}
