# dsh-web-search-openserp

English | [中文](README.zh.md)

An [OpenSERP](https://github.com/karust/openserp)-backed web **search and fetch** provider for the DeepSeek Harness web capability seam (`ctx.web`).

OpenSERP is a self-hosted SERP API that renders each engine through a real headless browser. One search here is a plain retrieval call against your instance — no API key, and no model turn per search.

This package registers **two** providers:

| Capability | Endpoint | Returns |
|---|---|---|
| `web_search` | `/mega/search`, `/{engine}/search` | citeable sources with title + snippet |
| `web_fetch` | `/extract` | cleaned page body as markdown |

---

## Why OpenSERP

The obvious way to build a free metasearch backend is to aggregate engine HTML and impersonate a browser at the TLS layer. In practice that fails on every engine that matters: against a data-centre IP, Baidu, Google and DuckDuckGo answer with a CAPTCHA, and a spoofed TLS fingerprint does not change that.

OpenSERP takes the other route — it drives a real Chromium — so the request that reaches the engine is an ordinary browser session. Measured on one host, same queries, same day:

| Engine | HTML aggregation (curl_cffi + `impersonate: chrome`) | OpenSERP (browser-rendered) |
|---|---|---|
| google | ❌ `Suspended: CAPTCHA` | ✅ 8 results, 5.8 s |
| duckduckgo | ❌ `CAPTCHA` | ✅ 5 results, 2.0 s |
| baidu | ❌ `Suspended: CAPTCHA` | ✅ 10 results, 1.2 s |

The trade is latency: a rendered search costs hundreds of milliseconds to a few seconds, where a pure HTTP fetch costs tens.

---

## Install

### From npm

```bash
dsh plugin add dsh-web-search-openserp --profile web
```

### From this repository

```bash
git clone <this repo> && cd dsh-web-search-openserp
dsh plugin add . --profile web
```

> Installing from a working copy links the directory rather than copying it, so a later `git pull` is picked up on the next `dsh web` restart. The reverse also holds: edits made only in a copy are **not** seen by the profile.

### Either way

The bundle patch pins `web.searchProvider` and `web.fetchProvider` to `openserp`. Because the seam selects a provider by id, a second usable provider registered without naming one makes every search fail with `WEB_PROVIDER_AMBIGUOUS` — so disable any other search provider you have installed:

```yaml
# ~/.dsh/profiles/web/cordis.patch.yml
- id: web-search-searxng
  disabled: true

- id: web-search-openserp
  config:
    baseURL: https://openserp.example.com
    engines: [baidu, google, duckduckgo]

- id: web
  config:
    searchProvider: openserp
    fetchProvider: openserp
```

### You need an OpenSERP instance

```bash
docker run -d --name openserp -p 127.0.0.1:7001:7000 \
  --restart unless-stopped karust/openserp:latest serve -a 0.0.0.0 -p 7000
```

`serve` is a required subcommand — the image entrypoint is bare `openserp`, and without a subcommand it prints help and exits 0, which a restart policy turns into a restart loop.

Setting `OPENSERP_DROP_ADS=1` on the instance makes it discard sponsored rows during parsing, which also keeps organic ranks contiguous. This provider filters ads client-side as well, so the two are belt and braces rather than alternatives.

---

## Configuration

Every key is editable from **Settings → Plugins → Plugin configuration** as well as from the settings document. The namespace is `web-search-openserp`.

| Key | Default | Meaning |
|---|---|---|
| `baseURL` | `$OPENSERP_URL` | Instance root. Missing or non-http(s) makes the provider report unavailable rather than fail every call. |
| `engines` | instance default | One entry hits that engine's dedicated endpoint; several hit `mega/search`, which merges and deduplicates. Known engines: `baidu`, `google`, `duckduckgo`, `bing`, `yandex`, `ecosia`. |
| `timeoutMs` | `20000` | Search resource backstop. Larger than a plain-HTTP provider's, because the instance may have to start a browser. |
| `maxSnippetChars` | `500` | Per-source snippet cap. |
| `extract` | `false` | Ask the instance to fetch and extract each target during search (`extract=1`). Richer grounding, markedly slower. |
| `fetchTimeoutMs` | `30000` | Fetch resource backstop. |
| `extractMode` | `auto` | How `/extract` obtains the page: `auto` (plain HTTP, escalating to a browser only for a JavaScript shell), `fast` (never render), `rendered` (always render). |
| `extractFullPage` | `false` | Keep the whole readable body instead of article-only text. On preserves nav and feature blocks an agent hunting for a link may need. |
| `extractUseLlmsTxt` | `false` | For a site root, prefer a published `/llms-full.txt` or `/llms.txt`. Cheap and precise on documentation sites; a no-op elsewhere. |
| `headers` | — | Extra request headers. The card edits Basic auth (username + password, with a reveal toggle); any other header is preserved on save but must be added in the settings document. |

### Why `bing` is not in the documented default

Measured against the same Chinese query, `bing` returned entirely unrelated results (Zhihu gossip for a `jieba` query). It costs a slot in the merge without adding signal. It remains selectable.

### `extract` on search is off by default

It fetches and renders every target server-side. That is a large latency increase for a modest result-count query, so it is opt-in; `web_fetch` is the better tool when the model has decided which page it needs.

---

## Provider selection

The seam auto-selects only when exactly one registered provider is usable. The shipped DeepSeek provider reports usable whenever a credential resolver exists, which its own `apply()` always supplies — so it answers true even with no key configured. Install this package **and** name the provider:

```yaml
- id: web
  config:
    searchProvider: openserp
    fetchProvider: openserp
```

Both capabilities come from the same instance, so naming both leaves no path back to a shipped provider.

---

## Mapping

### Search

`results[]` is normalised into the seam's `sources`, deduplicated by URL. Three independent signals mark a row as non-citable, and any one is sufficient:

1. `type: "ad"` — what the instance emits once it recognises a sponsored card;
2. `ad: true` — the same fact in the redundant boolean field;
3. `type: "answer_box" | "related_searches"` — SERP furniture, not a result.

A fourth, URL-based check exists because engines do not always label their ads. A sponsored Baidu row can arrive with `type: "organic"` and `ad: null`, dressed up as an official page — measured: the title read "Python asyncio 官方文档" while the URL was `http://nourl.ubs.baidu.com/61344`. That host is ad-only and is filtered. `www.baidu.com/link?url=` is deliberately **not** filtered: a genuine result (a Tsinghua University Press book page) arrived through it in the same SERP.

### Fetch

Every fetch result is `kind: 'text'`. OpenSERP cleans a page before returning it, so there is no "resource as served" arm to offer — a caller that needs the served markup, or needs to drive a page, belongs in a browser-automation tool instead. `markdown` is preferred over `text` because it keeps heading structure and links.

---

## Errors

Provider failures surface as `WebError` with `WEB_PROVIDER_ERROR`, or `WEB_ABORTED` when the caller's signal fired. The message carries the instance's own reason where it gave one.

A `400` on fetch is usually OpenSERP's private-network guard rejecting the target — it refuses loopback and private addresses by default. That is a policy refusal, not a transient fault, and no retry fixes it.

---

## Known limitations

**Anti-bot sites are unreachable from a data-centre IP.** CSDN, Zhihu and Stack Overflow all fail with `502 extract_failed`. This was measured to be an **IP reputation** problem, not a fingerprint defect and not fixable in this provider's code:

- OpenSERP's browser passes the `rebrowser` bot detector **9/9** (`navigator.webdriver`, CDP `Runtime.enable` leak, Playwright init scripts, viewport — all undetected) on the same instance;
- the same instance succeeds against those sites from a residential IP and fails from a data-centre IP;
- a datacentre proxy (even a Tier-1 one) does not help, because the ASN is what is being judged.

Reaching them needs a residential proxy whose ASN is an ISP. Note that a proxy on the **fetch** path requires the `X-Proxy-URL` header — `/extract` does not read the instance's global proxy setting, while the search endpoints do. And Chromium's `--proxy-server` does not accept an authenticated SOCKS proxy, so such a proxy has to be fronted by a local unauthenticated relay (e.g. `gost -L http://:8080 -F socks5://user:pass@host:port`).

**Search result URLs may be redirect wrappers.** Google results arrive as `google.com/goto?url=…` and Baidu results as `baidu.com/link?url=…`. They resolve correctly but are not the canonical URLs.

**Fetched markdown can contain mis-resolved relative links.** A relative link on `…/asyncio.html` may be rendered as `…/asyncio.html/asyncio-task.html`. Body text is unaffected; the links are not clickable.

**Extraction is not guaranteed.** `/extract` can return `extracted: null` for a page it could not clean; the provider then falls back to the engine excerpt on the search path.

---

## Compatibility

| Package | Version |
|---|---|
| DeepSeek Harness | `0.1.5-rc.2` |
| Node.js | `^22.19 \|\| >=24` |

The browser half registers a card into `settings.plugin.item`, keyed by the settings namespace it edits. It is built against the client seed table, so the bundle only ever requires `react`, `react/jsx-runtime`, `@deepseek-ai/dsh-client-store` and `@deepseek-ai/dsh-client-ui-primitives` — a value import of any other `@deepseek-ai/*` package fails the whole Web UI's plugin load, not just this card.

---

## License

MIT
