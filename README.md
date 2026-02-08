# Yumi Bot

A Facebook Messenger chatbot powered by AI. Yumi Bot connects to Messenger via [meta-messenger.js](https://github.com/nicejs-is-cool/meta-messenger.js) and uses the OpenAI-compatible API to generate intelligent responses — including web search, code interpretation, and image understanding.

## Features

- **AI-powered conversations** — mention the bot or use commands to chat with an AI agent
- **End-to-end encrypted (E2EE) message support**
- **Prefix-based command system** with categories, aliases, and easy extensibility
- **Image understanding** — send images and the bot can analyze them
- **Web search & code interpreter** tools available to the AI agent
- **Per-user conversation history** with prompt caching

## Prerequisites

- [Node.js](https://nodejs.org/) **v22.12.0** or higher
- A Facebook account with valid session cookies exported as JSON
- An OpenAI-compatible API key (OpenAI, or any compatible provider except Azure)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yumi-team/yumi-bot.git
cd yumi-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Bot
BOT_PREFIX=!
DEBUG=yumi-bot:*

# AI Provider (OpenAI-compatible)
API_KEY=your-api-key-here
BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4o

# Cookies
COOKIE_FILE_PATH=cookies.json
```

| Variable | Description |
|---|---|
| `BOT_PREFIX` | The prefix for bot commands (e.g. `!ping`) |
| `DEBUG` | Debug namespace filter for log output |
| `API_KEY` | Your OpenAI-compatible API key |
| `BASE_URL` | Base URL of the AI provider API |
| `MODEL_NAME` | The model to use for responses |
| `COOKIE_FILE_PATH` | Path to the Facebook cookies JSON file (relative to project root) |

### 4. Add Facebook cookies

Export your Facebook session cookies as JSON and save them to the file specified in `COOKIE_FILE_PATH` (e.g., `cookies.json`) in the project root. This file should contain an array of cookie objects exported from a browser extension such as [EditThisCookie](https://www.editthiscookie.com/), [J2Team Cookie](https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco), or [Cookie-Editor](https://cookie-editor.com/).

If you're using [J2Team Cookie](https://chromewebstore.google.com/detail/j2team-cookies/okpidcojinmlaakglciglbpcpajaibco), after saving your cookies, modify the code in `Bot.ts` from:

```ts
const cookies = Utils.parseCookies(JSON.parse(cookiesString));

super(cookies);
```

to

```ts
const rawCookies = JSON.parse(cookiesString);
const cookies = Utils.parseCookies(rawCookies.cookies);

super(cookies);
```


### 5. Run the bot

**Development** (with hot-reload):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

## Commands

Commands are organized by category inside `src/commands/`. Each subdirectory represents a category.

| Command | Alias | Description |
|---|---|---|
| `ping` | `p` | Check bot latency |
| `uptime` | — | Show how long the bot has been running |

### Creating a command

Create a new `.ts` file inside a category folder under `src/commands/`:

```ts
import { Bot } from "@/classes/Bot";

export default Bot.createCommand({
    name: "hello",
    aliases: ["hi"],
    run: async ({ message, reply }) => {
        reply("Hello there!");
    },
});
```

## AI Chat

Mention the bot by name in any conversation to trigger an AI response. The bot supports text messages and image attachments. Conversation history is maintained per user with automatic prompt caching.

## Project Structure

```
src/
├── index.ts            # Entry point
├── agent/              # OpenAI-compatible AI agent
├── classes/            # Bot client class
├── commands/           # Command files organized by category
│   ├── debug/          # Debug commands (ping, uptime)
│   └── info/           # Info commands
├── events/             # Event listeners (message, e2eeMessage)
├── handlers/           # Command & event handler loaders
├── typings/            # TypeScript type declarations
└── utils/              # Utility functions (logger, import helper)
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start in development mode with hot-reload |
| `npm start` | Compile and run for production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Check formatting with Prettier |
| `npm run format:fix` | Auto-format with Prettier |

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
