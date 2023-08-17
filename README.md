# GitHub Sheets

GitHub APIs and Google Sheets, together at last.

## Configuration

Create a `.env` file to hold the appropriate configuration:

```shell
GOOGLE_CREDENTIALS={ "type": "authorized_user", "client_id": "<...>", "client_secret": "<...>", "refresh_token": "<...>" }
SPREADSHEET_ID=<...>
```

- `GOOGLE_CREDENTIALS`: Credentials required to access the Google Sheets API (see below for details).
- `SPREADSHEET_ID`: The spreadsheet ID is shown in the sheet URL: `https://docs.google.com/spreadsheets/d/<here>/edit#gid=0`.
- `WORKSHEET_NAME` (default `"GitHubData"`): The worksheet where the usernames will be listed.
- `USER_RANGE` (default `"A:A"`): The range where the usernames will be listed.

### Credentials

Generate a project, OAuth app and `credentials.json` file as described in the [Google Developer docs]. This file will include the `client_id` and `client_secret` required above.

Now use `npm run credentials` to generate the `refresh_token` also required above.

[google developer docs]: https://developers.google.com/sheets/api/quickstart/nodejs#set_up_your_environment
