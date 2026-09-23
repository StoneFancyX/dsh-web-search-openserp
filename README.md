# dsh-web-search-openserp

[English](README.en.md) | 中文

基于 [OpenSERP](https://github.com/karust/openserp) 的 DeepSeek Harness web 能力接缝（`ctx.web`）**搜索与抓取** provider。

OpenSERP 是一个自托管 SERP API，它用**真实的无头浏览器**渲染每个引擎。这里的一次搜索就是对你自有实例的一次普通检索调用——无需 API key，也不消耗模型轮次。

本包注册**两个** provider：

| 能力 | 端点 | 返回 |
|---|---|---|
| `web_search` | `/mega/search`、`/{engine}/search` | 可引用的来源（标题 + 摘要）|
| `web_fetch` | `/extract` | 清洗后的正文（markdown）|

---

## 为什么用 OpenSERP

搭一个免费的元搜索后端，最直觉的做法是抓取各引擎的 HTML、并在 TLS 层伪装成浏览器。但这条路在每个重要的引擎上都会失败：面对数据中心 IP，百度、Google、DuckDuckGo 都会返回验证码，而伪造的 TLS 指纹改变不了这一点。

OpenSERP 走的是另一条路——它驱动真实的 Chromium——所以到达引擎的请求就是一个普通的浏览器会话。在同一台主机、同一天、同样的查询下实测：

| 引擎 | HTML 聚合（curl_cffi + `impersonate: chrome`）| OpenSERP（浏览器渲染）|
|---|---|---|
| google | ❌ `Suspended: CAPTCHA` | ✅ 8 条，5.8 秒 |
| duckduckgo | ❌ `CAPTCHA` | ✅ 5 条，2.0 秒 |
| baidu | ❌ `Suspended: CAPTCHA` | ✅ 10 条，1.2 秒 |

代价是延迟：一次渲染搜索要几百毫秒到几秒，而纯 HTTP 抓取只要几十毫秒。

---

## 安装

### 从 npm

```bash
dsh plugin add dsh-web-search-openserp --profile web
```

### 从本仓库

```bash
git clone <本仓库> && cd dsh-web-search-openserp
dsh plugin add . --profile web
```

> 从工作副本安装是**链接**该目录而非复制，所以之后的 `git pull` 会在下次 `dsh web` 重启时生效。反过来也成立：只在某些副本里做的改动，profile 是**看不到**的。

### 无论哪种方式

bundle patch 会把 `web.searchProvider` 和 `web.fetchProvider` 都钉到 `openserp`。由于接缝是按 id 选择 provider，**再注册第二个可用 provider 而不点名指定，会让每次搜索都以 `WEB_PROVIDER_AMBIGUOUS` 失败**——所以请禁用你已安装的其它搜索 provider：

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

### 你需要一个 OpenSERP 实例

```bash
docker run -d --name openserp -p 127.0.0.1:7001:7000 \
  --restart unless-stopped karust/openserp:latest serve -a 0.0.0.0 -p 7000
```

`serve` 是**必须的子命令**——镜像的 entrypoint 只有裸 `openserp`，不给子命令时它会打印帮助并以 0 退出，而重启策略会把这种"正常退出"变成无限重启。

在实例上设置 `OPENSERP_DROP_ADS=1` 会让它在解析阶段就丢弃推广位，同时保持 organic 排名连续。本 provider 也会在客户端过滤广告，所以两者是双保险，而非二选一。

---

## 配置

每个键都能在 **设置 → 插件 → 插件配置** 里编辑，也能直接从设置文档改。命名空间是 `web-search-openserp`。

| 键 | 默认 | 含义 |
|---|---|---|
| `baseURL` | `$OPENSERP_URL` | 实例根地址。缺失或非 http(s) 会让 provider 报告"不可用"，而不是让每次调用都失败。 |
| `engines` | 实例默认 | 填一个走该引擎的专用端点；填多个走 `mega/search`，它会合并去重。已知引擎：`baidu`、`google`、`duckduckgo`、`bing`、`yandex`、`ecosia`。 |
| `timeoutMs` | `20000` | 搜索资源上限。比纯 HTTP provider 大，因为实例可能要现开浏览器。 |
| `maxSnippetChars` | `500` | 单条来源的摘要上限。 |
| `extract` | `false` | 让实例在搜索时顺带抓取并抽取每个目标页（`extract=1`）。grounding 更扎实，但明显更慢。 |
| `fetchTimeoutMs` | `30000` | 抓取资源上限。 |
| `extractMode` | `auto` | `/extract` 如何获取页面：`auto`（先纯 HTTP，只有遇到 JavaScript 空壳才升级到浏览器）、`fast`（从不渲染）、`rendered`（总是渲染）。 |
| `extractFullPage` | `false` | 保留整页可读正文，而非只取文章部分。开启后会保留导航和功能区块，对正在寻找链接的 agent 有用。 |
| `extractUseLlmsTxt` | `false` | 对于站点根，优先使用其发布的 `/llms-full.txt` 或 `/llms.txt`。在文档站上又快又准，在别处是空操作。 |
| `headers` | — | 额外请求头。卡片里编辑 Basic 认证（账号 + 密码，带显示开关）；其它请求头在保存时会被保留，但要新增得改设置文档。 |

### 为什么文档里的默认不含 `bing`

同一次中文查询实测，`bing` 返回的结果完全不相关（用 `jieba` 查询返回了知乎八卦）。它在合并里占一个位子却不带来信号。它仍可被选中。

### 搜索时的 `extract` 默认关闭

它会在服务端抓取并渲染每一个目标页。对一次只看结果数的查询来说，这是很大的延迟增长，所以做成 opt-in；当模型已经确定要看哪个页面时，`web_fetch` 是更合适的工具。

---

## Provider 选择

接缝只在**恰好一个** provider 可用时自动选择。内置的 DeepSeek provider 只要凭据解析器存在就报告"可用"，而它自己的 `apply()` 总会提供解析器——所以**即使没配 key 它也回答 true**。因此安装本包时**同时**把 provider 点名指定：

```yaml
- id: web
  config:
    searchProvider: openserp
    fetchProvider: openserp
```

两种能力都来自同一个实例，所以两个都点名之后，就没有回到内置 provider 的路径了。

---

## 映射

### 搜索

`results[]` 被规范化为接缝的 `sources`，按 URL 去重。三个互相独立的信号会把一行标记为"不可引用"，任一成立即可：

1. `type: "ad"` —— 实例识别出推广卡片时会给出的值；
2. `ad: true` —— 同一事实的冗余布尔字段；
3. `type: "answer_box" | "related_searches"` —— SERP 的功能模块，不是结果。

还有第四道基于 URL 的检查，因为引擎并不总是标记自己的广告。一条百度的推广行可能以 `type: "organic"` 和 `ad: null` 到达，还包装成官方页面的样子——实测：标题写着「Python asyncio 官方文档」，而 URL 是 `http://nourl.ubs.baidu.com/61344`。该主机是纯广告跳转，会被过滤掉。

`www.baidu.com/link?url=` 则**刻意不过滤**：同一次 SERP 里，一条真实结果（清华大学出版社的书页）正是通过它到达的。

### 抓取

每次抓取的结果都是 `kind: 'text'`。OpenSERP 会先清洗页面再返回，所以没有"原样资源"这一路可提供——需要原始标记、或需要驱动页面的调用方，属于浏览器自动化工具的地盘。优先用 `markdown` 而非 `text`，因为它保留了标题层级和链接。

---

## 错误

provider 失败会以 `WebError` 暴露，code 为 `WEB_PROVIDER_ERROR`；调用方的 signal 触发时是 `WEB_ABORTED`。实例给出了自己的原因时，消息里会带上它。

抓取路径上的 `400` 通常是 OpenSERP 的私网防护拒绝了目标——它默认拒绝回环和私有地址。那是策略性拒绝，不是瞬时故障，重试解决不了。

---

## 已知限制

**从数据中心 IP 无法访问反爬站点。** CSDN、知乎、Stack Overflow 都会以 `502 extract_failed` 失败。经实测，这是 **IP 信誉**问题，不是指纹缺陷，也无法在本 provider 的代码里解决：

- 同一个实例上，OpenSERP 的浏览器通过 `rebrowser` 机器人检测 **9/9**（`navigator.webdriver`、CDP `Runtime.enable` 泄漏、Playwright 初始化脚本、视口——全部未被检出）；
- 同一个实例，从住宅 IP 能访问这些站点，从数据中心 IP 就不能；
- 数据中心代理（哪怕是 Tier-1 的）也没用，因为被评判的正是 ASN。

要访问它们，需要一个 ASN 属于 ISP 的住宅代理。注意**抓取路径**上的代理需要用 `X-Proxy-URL` 请求头——`/extract` 不读实例的全局代理设置，而搜索端点会读。另外 Chromium 的 `--proxy-server` 不接受带认证的 SOCKS 代理，所以这类代理必须先由本地无认证中转承接（如 `gost -L http://:8080 -F socks5://user:pass@host:port`）。

**搜索结果的 URL 可能是跳转包装。** Google 结果以 `google.com/goto?url=…` 到达，百度结果以 `baidu.com/link?url=…` 到达。它们能正确解析，但不是规范 URL。

**抓取到的 markdown 里可能有解析错误的相对链接。** `…/asyncio.html` 上的相对链接可能被渲染成 `…/asyncio.html/asyncio-task.html`。正文文字不受影响，但这些链接点不开。

**抽取不保证成功。** `/extract` 对无法清洗的页面可能返回 `extracted: null`；此时 provider 在搜索路径上会回退到引擎摘要。

---

## 兼容性

| 包 | 版本 |
|---|---|
| DeepSeek Harness | `0.1.5-rc.2` |
| Node.js | `^22.19 \|\| >=24` |

浏览器半边会把一张卡片注册进 `settings.plugin.item`，以它所编辑的设置命名空间为 key。它是对着客户端 seed 表构建的，所以产物只会 require `react`、`react/jsx-runtime`、`@deepseek-ai/dsh-client-store` 和 `@deepseek-ai/dsh-client-ui-primitives`——**value-import 任何其它 `@deepseek-ai/*` 包，失败的不是这张卡片，而是整个 Web UI 的插件加载**。

---

## 许可证

MIT
