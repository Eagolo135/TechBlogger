# OpenAI MCP Tools

This folder contains a standalone MCP server that exposes custom tools powered by the OpenAI API.

## Included Tools

- `summarize_text`: summarize technical text into bullet points
- `generate_blog_ideas`: generate blog ideas with angle and outline
- `create_blog_post_draft`: generate an in-depth, engaging blog post draft from vague or detailed input
- `format_blog_post_for_publish`: transform rough drafts into publication-ready structured posts
- `website_change_operator`: plan and apply broad website code/content/tool/page changes with file operations
- `web_search`: internet search with top links and snippets
- `screenshot_full_page`: capture full-page website screenshots
- `read_screenshot_image`: analyze screenshots or other images with OpenAI vision
- `agentic_research_chat`: orchestrate search, screenshots, image reading, and final answer synthesis

## Setup

1. Install dependencies:

```bash
cd mcp/openai-tools
npm install
```

2. Install Chromium for Playwright screenshots:

```bash
npx playwright install chromium
```

3. Create environment file:

```bash
copy .env.example .env
```

4. Set `OPENAI_API_KEY` in `.env`.

Optional settings:

- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `OPENAI_VISION_MODEL` (default: same as `OPENAI_MODEL`)
- `MCP_SERVER_NAME` (default: `techblogger-openai-tools`)

## Run

```bash
npm start
```

The server uses stdio transport and is designed to be launched by an MCP client.

## Example MCP Client Configuration

Use this in any MCP-capable client configuration (adjust absolute paths as needed):

```json
{
  "mcpServers": {
    "techblogger-openai-tools": {
      "command": "node",
      "args": [
        "c:/xampp/htdocs/alexander/Web Dev/Projects/TechBlogger/mcp/openai-tools/src/server.js"
      ],
      "cwd": "c:/xampp/htdocs/alexander/Web Dev/Projects/TechBlogger/mcp/openai-tools",
      "env": {
        "OPENAI_API_KEY": "YOUR_OPENAI_KEY",
        "OPENAI_MODEL": "gpt-4.1-mini"
      }
    }
  }
}
```

## Security Notes

- Never commit `.env` with your real key.
- Rotate keys if accidentally exposed.
- Consider per-tool or per-project keys with usage limits.
