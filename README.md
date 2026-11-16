# Plagx Draft Preflight for Wix

*A free academic writing tool by Plagiarism Checker X.*

**Plagx Draft Preflight is a free, open-source draft checker app for the Wix dashboard.** Pick a blog post (draft or published) or paste any text, and check it for word count and reading time, in-text citations against the reference list, punctuation and basic grammar before you publish. Use it as an **essay checker**, **word count and reading time tool**, **citation checker** or **reference list checker** for blog posts, articles and academic pages.

- Checks blog posts, including unpublished drafts, or pasted text
- Text is checked in your browser: nothing is stored, and nothing is sent to Plagiarism Checker X
- Read-only: the app never changes your site
- APA and MLA in-text citations
- Same rules as the [plagx-preflight](https://github.com/plagiarismcheckerx/plagx-preflight) library

**[Try the live demo →](https://plagiarismcheckerx.github.io/plagx-preflight/)**

Developer downloads: [npm](https://www.npmjs.com/package/plagx-preflight) · [NuGet](https://www.nuget.org/packages/Plagx.Preflight) · [Maven Central](https://central.sonatype.com/artifact/io.github.plagiarismcheckerx/plagx-preflight) · [PyPI](https://pypi.org/project/plagx-preflight/) · [GitHub](https://github.com/plagiarismcheckerx/plagx-preflight)

Need a quick citation online? Use the [free citation generator](https://plagiarismcheckerx.com/citation-generator?utm_source=plagx-preflight-wix).

> Plagx Draft Preflight is a free academic writing utility by Plagiarism Checker X. It checks structure, references, punctuation and basic grammar. Plagiarism checking and AI-generated text detection are available in Plagiarism Checker X, linked at the end of this page.

## Use

1. Add **Plagx Draft Preflight** to your site from the Wix App Market.
2. In your site's dashboard, open **Apps → Plagx Draft Preflight**.
3. Choose **Blog post** (type to search, or pick from the list) or **Pasted text**, set word limits and citation style if you need them, and click **Check draft**.

Headings, paragraphs, list items and quotes are read in order. The references section is the first heading named References, Bibliography, Works Cited, Sources or similar; each paragraph or list item after it is one reference. To check a site page, copy its text into **Pasted text**.

## Checks

| Group | Examples |
|---|---|
| Length & structure | Word, sentence and paragraph counts, reading time, word limits, long sentences and paragraphs |
| References | Citations with no entry in the References section, references that are never cited |
| Punctuation | Unmatched quotes and brackets, double spaces, spacing around punctuation |
| Basic grammar | Repeated words, *a* / *an*, sentence capitals, common word confusions; optional passive-voice hints |

## Privacy and permissions

- **Permissions:** Read Draft Blog Posts (`SCOPE.DC-BLOG.READ-DRAFT-POSTS`) and Read Blog (`SCOPE.DC-BLOG.READ-BLOGS`). Nothing is written.
- **Data:** the selected post is checked in the site owner's browser. Published posts are read with the Wix Blog SDK as the signed-in user. Drafts can only be read with the app's own identity, so a small Wix-hosted endpoint (`src/api/drafts.ts`) reads them for dashboard users only. The app has no server of its own and stores nothing.

## Development

Built with the [Wix CLI](https://dev.wix.com/docs/wix-cli) (React and the Wix Design System); Wix hosts the app.

```bash
npm install
npm test           # rich-content conversion and blog reader tests
npm run typecheck  # TypeScript check
npm run dev        # run on a Wix development site
npm run build      # build the app
npm run release    # release a new app version
npm run sync       # copy the latest core from ../plagx-preflight/src
```

| Path | What it does |
|---|---|
| `src/extensions/dashboard/pages/preflight/preflight.tsx` | The dashboard page |
| `src/extensions/dashboard/pages/preflight/blog.js` | Lists and reads blog posts (drafts through the endpoint, published posts with `@wix/blog`) |
| `src/api/drafts.ts` | Wix-hosted endpoint that reads drafts with the app's identity, for dashboard users only |
| `src/extensions/dashboard/pages/preflight/ricos.js` | Turns Wix rich content into paragraphs |
| `src/lib/` | The Plagx Preflight core, copied from [plagx-preflight](https://github.com/plagiarismcheckerx/plagx-preflight) (MIT) |

## Plagx Preflight - Free Draft & Grammar Checker

An open-source writing utility for students, researchers and developers. Check length, structure, citations, punctuation and basic grammar before you submit.

Developed by Plagiarism Checker X.

Plagx Preflight gives writing suggestions; it does not detect plagiarism or AI-generated text. For full document checks, explore [Text Similarity Detector](https://plagiarismcheckerx.com/?utm_source=plagx-preflight-wix) and its [AI Content Detector](https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-preflight-wix).

## License

MIT © Plagiarism Checker X
