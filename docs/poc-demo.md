# Proof Of Concept Demo

This demo shows the intended editor workflow without touching generated HTML.

## 1. Inspect the current content source

```bash
npm run content:list
```

Expected result: the CLI prints the current post slugs and titles from [content/site-content.yaml](content/site-content.yaml).

## 2. Update content in the single source of truth

Example change with the helper CLI:

```bash
npm run content:set -- posts[2].title "YAML Content Ops for Fast Static Publishing"
```

You can also open [content/site-content.yaml](content/site-content.yaml) and edit the same field directly.

## 3. Validate the content model

```bash
npm run content:check
```

Expected result: the validator confirms that post slugs, titles, and article sections are still valid.

## 4. Rebuild the site

```bash
npm run build:static
```

Expected result: Next.js regenerates the static pages in out/ from the updated YAML source.

## 5. Publish

```bash
git add .
git commit -m "Update TechBlogger content"
git push origin main
```

Expected result:

- GitHub Pages workflow rebuilds and publishes the latest site
- Vercel auto-deploys too if the repository is connected there

At no point should you edit generated files in out/.