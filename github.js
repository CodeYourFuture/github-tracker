import { Octokit } from "@octokit/rest";

export class GitHub {

	/**
	 * @param {string} auth - GitHub PAT
	 * @returns {GitHub}
	 */
	static fromToken(auth) {
		return new GitHub(new Octokit({ auth }));
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
