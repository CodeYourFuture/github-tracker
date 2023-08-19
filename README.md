# GitHub Sheets

GitHub APIs and Google Sheets, together at last.

## Configuration

The following environment variables are used:

- `COMMIT_RANGE` (default `"B2:B"`): The range where the commits will be written.
- `GITHUB_TOKEN`: Token for accessing the GitHub APIs.
- `GOOGLE_CREDENTIALS`: Credentials required to access the Google Sheets API.
- `SPREADSHEET_ID`: The spreadsheet ID is shown in the sheet URL: `https://docs.google.com/spreadsheets/d/<here>/edit#gid=0`.
- `WORKSHEET_NAME` (default `"GitHubData"`): The worksheet where the usernames will be listed.
- `USER_RANGE` (default `"A2:A"`): The range where the usernames will be listed.

Additionally, for testing purposes:

- `E2E_TEMPLATE`: Sheet ID of the template to use for the end-to-end test.

## Production setup

- Generate a project, OAuth app and `credentials.json` file as described in the [Google Developer docs]. This file will include the `client_id` and `client_secret` required above.
- Run `npm run setup -- --credentials` to generate the appropriate credentials
- Set the `SPREADSHEET_ID`, `COMMIT_RANGE` and `USER_RANGE` as needed.

## Dev setup

- Clone the repo and run `npm ci` to install the dependencies.
- Create a [GitHub personal access token] and create a `.env` file containing it:
    ```bash
    GITHUB_TOKEN=<...>
    ```
- Generate a project, OAuth app and `credentials.json` file as described in the [Google Developer docs]. This file will include the `client_id` and `client_secret` required above.
- Use `npm run dev` to generate the appropriate credentials and create a test spreadsheet for you. This will output data to add to your `.env` file.
- Use `npm run ship` to ensure that the linting, type checks and tests pass.

[github personal access token]: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic
[google developer docs]: https://developers.google.com/sheets/api/quickstart/nodejs#set_up_your_environment
