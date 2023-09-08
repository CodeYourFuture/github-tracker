import { Octokit } from "@octokit/core";
import { throttling } from "@octokit/plugin-throttling";

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

	static USER_QUERY = `
		query GetUsers($q: String!) {
			search(first: 1, query: $q, type: USER) {
				nodes {
					...on User {
						login
					}
				}
			}
		}
	`;

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
		const { data: { total_count } } = await this.service.request("GET /search/commits", {
			q: `author:${username} author-date:${this._toISODate(start)}..${this._toISODate(end)}`,
		});
		return total_count;
	}

	/**
	 * @param {string} username
	 * @returns {Promise<boolean>}
	 */
	async validUsername(username) {
		const canonical = username.toLowerCase();
		/** @type {{ search: { nodes: { login: string }[] } }} */
		const { search: { nodes: items } } = await this.service.graphql({
			q: `user:${canonical}`,
			query: GitHub.USER_QUERY,
		});
		return items.find(({ login }) => login.toLowerCase() === canonical) !== undefined;
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
