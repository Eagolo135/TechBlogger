# TechBlogger

TechBlogger is a static, content-driven tech blog built with Next.js 16, Tailwind CSS 4, and shadcn/ui-style components on top of Radix primitives. The site is designed so editors update one structured source file and never touch generated HTML pages.

## Stack

- Next.js App Router
- Tailwind CSS 4
- shadcn/ui component structure with Radix primitives
- YAML content source
- GitHub Pages workflow plus Vercel-compatible static export

## Single Source Of Truth

All visible site content lives in [content/site-content.yaml](content/site-content.yaml).

That file drives:

- Homepage hero and stats
- Topic grid and workflow sections
- FAQ content
- Post listing cards
- Static article routes

Generated output in out/ is a build artifact only. Do not edit it by hand.

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Start the development server.

```bash
npm run dev
```

3. Open http://localhost:3000.

## Google Sign-In Setup

The signup page supports Google sign-in through Google Identity Services.

1. Create a Google OAuth Client ID (Web application) in Google Cloud Console.
2. Add these Authorized JavaScript origins:
	- `http://localhost:3000`
	- your GitHub Pages origin (for example `https://eagolo135.github.io`)
3. Create a local `.env.local` file with:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is safe to expose client-side and is required for the Google button to render.

For GitHub Pages deployment, also add a repository variable named `NEXT_PUBLIC_GOOGLE_CLIENT_ID` under
`Settings > Secrets and variables > Actions > Variables`.

## Update Content

You have two supported options.

Option 1: edit the source file directly.

- Open [content/site-content.yaml](content/site-content.yaml)
- Change any field you need
- Run validation and build

Option 2: use the helper CLI.

```bash
npm run content:list
npm run content:get -- posts[0].title
npm run content:set -- posts[0].title "Shipping AI features with fewer rollback nights"
```

Then validate the content:

```bash
npm run content:check
```

## Build And Publish

Build the static site locally:

```bash
npm run build:static
```

That produces the export in out/ and adds .nojekyll for GitHub Pages compatibility.

### GitHub Pages

This repository includes [the Pages workflow](.github/workflows/deploy-pages.yml). Once the repo is pushed to GitHub and Pages is enabled, every push to main will:

1. Install dependencies
2. Run the Next.js static build
3. Upload the out/ artifact
4. Publish the site with GitHub Pages

Expected Pages URL format:

```text
https://<your-github-username>.github.io/TechBlogger/
```

### Vercel

You can also import the same repository into Vercel.

- Framework preset: Next.js
- Install command: npm install
- Build command: npm run build

The project uses static export, so Vercel will deploy a static version of the site from the same source model.

## Tooling Included

- [scripts/content-cli.mjs](scripts/content-cli.mjs): list, read, and update source content fields
- [scripts/validate-content.mjs](scripts/validate-content.mjs): fast validation for required fields and duplicate slugs
- [scripts/prepare-pages.mjs](scripts/prepare-pages.mjs): adds GitHub Pages compatibility files after build
- [docs/poc-demo.md](docs/poc-demo.md): short proof-of-concept update and publish walkthrough

## MCP Tools With OpenAI API Keys

This repository includes a standalone MCP server package at [mcp/openai-tools](mcp/openai-tools).

- Setup and client configuration: [mcp/openai-tools/README.md](mcp/openai-tools/README.md)
- Quick run from project root: `npm run mcp:openai`
- Required env var: `OPENAI_API_KEY`

## Proof Of Concept Demo

See [docs/poc-demo.md](docs/poc-demo.md) for a short end-to-end demo that shows:

- how content is updated
- how the site is rebuilt
- how the site is published without editing generated pages
