# Research 08 — SEO + AI-SEO + GitHub Discoverability

**Date**: 2026-04-18 · **Status**: Decision recorded

## Top decisions locked

1. **/llms.txt + /llms-full.txt at site root** following https://llmstxt.org spec
2. **Schema.org JSON-LD** with SoftwareApplication + FAQPage on every doc page
3. **GPTBot / ClaudeBot / PerplexityBot allowed** in robots.txt (full Allow)
4. **Comparison page** as the highest-ROI GEO content (`/docs/comparison`)
5. **20 GitHub topics set** — already applied to repo
6. **CITATION.cff** added for academic citation
7. **48-hour coordinated launch** (HN + Reddit + ProductHunt) when v0.1 ships

## Copy-paste assets (saved verbatim from research)

### llms.txt template
See `website/llms.txt` (to be created in `wt/website`).

### Comparison table template
```
| Feature | open-codesign | Claude Design | v0 (Vercel) | Bolt.new |
|---|---|---|---|---|
| Open source | ✅ Apache-2.0 | ❌ Closed | ❌ Closed | ✅ OSS (bolt.diy) |
| Desktop native | ✅ Electron | ❌ Web only | ❌ Web only | ❌ Web only |
| Bring your own key | ✅ Any provider | ❌ Anthropic only | ❌ Vercel only | ⚠️ Limited |
| Local / offline | ✅ Fully local | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| Models | 20+ (Claude, GPT, Gemini, Ollama) | Claude only | GPT-4o | Multi-LLM |
| Price | Free forever | Paid subscription | Freemium | Freemium |
| Output | HTML/CSS + PPTX/PDF | HTML/PDF/PPTX/Canva | React | Full-stack |
| Data privacy | 100% local | Cloud-processed | Cloud | Cloud |
```

### 20 GitHub topics (locked)
ai-design, ai-design-tool, claude-design, open-source, electron, desktop-app, byok, local-first, anthropic, openai, gemini, deepseek, ollama, multi-model, prompt-to-design, html-prototype, pptx-export, pdf-export, shadcn, tailwindcss

### Show HN draft
Title (148 chars):
> Show HN: open-codesign – open-source Electron AI design tool, BYOK, Claude/GPT-4o/Gemini/Ollama

Body (~600 words): see archived agent output 2026-04-18 (we will refine before launch).

### 15 awesome-list submission targets
1. sindresorhus/awesome-electron (27K) — needs 40+ stars, screenshot, binary
2. Shubhamsaboo/awesome-llm-apps (105K)
3. mahseema/awesome-ai-tools
4. theresanaiforthat.com
5. tools.ai (Ben's Bites)
6. futurepedia.io
7. Product Hunt (schedule, find a hunter)
8. alternativeto.net (file as "Claude Design alternative")
9. openalternative.co (indexed by Perplexity)
10. unicodeveloper/awesome-opensource-apps
11. vitejs/awesome-vite (14K)
12. Hannibal046/Awesome-LLM
13. heshengtao/awesome-claude-for-developer
14. alvinreal/awesome-opensource-ai
15. alexpate/awesome-design-systems (17K)

### Robots.txt (allow all AI crawlers)
Already in plan; will be created in `wt/website` per the SEO research recommendation.

### CITATION.cff
Added at repo root (separate small commit).

## Anti-abandonment rules (per research)

These signal "alive" to humans + AI:
1. Tag a release every 6 weeks even for minor fixes
2. Keep CI badge green
3. README must have screenshot or GIF in first viewport
4. Triage every issue within 7 days
5. Maintain `good-first-issue` label list

## Sources

15+ URLs archived in conversation log on 2026-04-18; key references:
- https://llmstxt.org
- https://geneo.app/blog/geo-generative-engine-optimization-open-source
- https://arxiv.org/html/2509.08919v1 (Princeton GEO research)
- https://nuxtseo.com/learn-seo/vue/ssr-frameworks/vitepress
- https://gingiris.github.io/growth-tools/blog/2026/03/25/...
