/**
 * Card dictionaries. The shell ships zh and en; a key missing from a
 * dictionary falls back to the other, so both are kept complete.
 *
 * Engine names are proper nouns and live as literals in the store's choice
 * list rather than here, the same way the sibling cards treat vendor names.
 *
 * @module dsh-web-search-openserp/client/locales
 */

/** Dictionary namespace this plugin owns. */
export const OPENSERP_LOCALE_NS = 'web-search-openserp'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  title: 'OpenSERP 搜索',
  description: '自建 OpenSERP 实例，为 web_search 与网页抓取提供结果。',
  baseURL: '实例地址',
  'baseURL.placeholder': 'http://openserp.internal:7000',
  'baseURL.fromEnvironment': '当前由环境变量 {env} 提供：{url}',
  'baseURL.unset': '未配置：请填写实例地址，或设置环境变量 {env}。',
  'baseURL.invalid': '请填写 http:// 或 https:// 开头的地址。',
  search: '搜索',
  'search.hint': '以下设置作用于 web_search。',
  engines: '搜索引擎',
  'engines.hint':
    '不勾选 = 自动（实例默认引擎）；勾选一个走该引擎的专用接口，勾选多个走 mega 聚合接口去重合并。',
  timeoutMs: '搜索超时（毫秒）',
  'timeoutMs.hint': '一次搜索的资源上限；实例要现开浏览器，冷启动可能需要数秒。',
  maxSnippetChars: '摘要上限（字符）',
  'maxSnippetChars.hint': '每条结果的正文截断长度；开启正文抽取后一页很长，靠它收敛。',
  extract: '搜索时顺带抽取正文',
  'extract.hint': '让实例抓取并抽取每个结果页（extract=1）：内容更完整，但一次搜索会明显变慢。',
  fetch: '抓取',
  'fetch.hint': '以下设置作用于单 URL 的正文抓取。',
  fetchTimeoutMs: '抓取超时（毫秒）',
  'fetchTimeoutMs.hint': '一次单页抓取的资源上限；需要渲染时服务端要现开浏览器。',
  extractMode: '抓取模式',
  'extractMode.inherit': '跟随默认（auto）',
  'extractMode.auto': 'auto —— 先普通请求，疑似 JS 壳再渲染',
  'extractMode.fast': 'fast —— 从不渲染（单页应用会失败）',
  'extractMode.rendered': 'rendered —— 总是渲染（最慢）',
  extractFullPage: '整页抽取（保留导航）',
  'extractFullPage.hint': '关闭时按正文抽取，去掉导航与页面装饰；开启则保留，便于找链接或菜单。',
  extractUseLlmsTxt: '优先 llms.txt',
  'extractUseLlmsTxt.hint': '站点根路径有 /llms-full.txt 或 /llms.txt 时优先使用；其它站点无影响。',
  'number.invalid': '请填写不小于 1 的整数。',
  authUser: '账号',
  'authUser.placeholder': 'Basic Auth 用户名（可选）',
  authPass: '密码',
  'authPass.placeholder': 'Basic Auth 密码（可选）',
  'authPass.show': '显示密码',
  'authPass.hide': '隐藏密码',
  'auth.hint': '留空则不发送认证；保存后编码为 Authorization: Basic …，其它请求头原样保留。',
  save: '保存',
  discard: '放弃更改',
  reset: '恢复默认',
  dirty: '未保存',
  saving: '保存中…',
  readonly: '当前部署的配置为只读。',
  loading: '加载中…',
  error: '读取配置失败：{message}',
}

/** English dictionary, checked complete against the zh key set. */
export const en = {
  title: 'OpenSERP search',
  description: 'A self-hosted OpenSERP instance backing web_search and page fetch.',
  baseURL: 'Instance URL',
  'baseURL.placeholder': 'http://openserp.internal:7000',
  'baseURL.fromEnvironment': 'Currently supplied by {env}: {url}',
  'baseURL.unset': 'Not configured — set an instance URL, or export {env}.',
  'baseURL.invalid': 'Enter an http:// or https:// URL.',
  search: 'Search',
  'search.hint': 'These settings shape web_search.',
  engines: 'Search engines',
  'engines.hint':
    'Leave all unchecked for automatic (instance default); one engine uses its dedicated route, several use the mega route, which merges and deduplicates.',
  timeoutMs: 'Search timeout (ms)',
  'timeoutMs.hint':
    'Resource backstop for one search; the instance launches a browser, so a cold start takes seconds.',
  maxSnippetChars: 'Snippet cap (characters)',
  'maxSnippetChars.hint':
    'Truncation length per result; an extracted body is a whole page, and this is what bounds it.',
  extract: 'Extract page bodies during search',
  'extract.hint':
    'Ask the instance to fetch and extract every result (extract=1): richer text, markedly slower search.',
  fetch: 'Fetch',
  'fetch.hint': 'These settings shape single-URL extraction.',
  fetchTimeoutMs: 'Fetch timeout (ms)',
  'fetchTimeoutMs.hint':
    'Resource backstop for one single-URL extraction; a rendered fetch launches a browser.',
  extractMode: 'Extraction mode',
  'extractMode.inherit': 'Instance default (auto)',
  'extractMode.auto': 'auto — plain HTTP first, render only a JS shell',
  'extractMode.fast': 'fast — never render (single-page apps fail)',
  'extractMode.rendered': 'rendered — always render (slowest)',
  extractFullPage: 'Full-page extraction (keep navigation)',
  'extractFullPage.hint':
    'Off runs article extraction, stripping navigation and landing furniture; on keeps them, which is what an agent hunting a link needs.',
  extractUseLlmsTxt: 'Prefer llms.txt',
  'extractUseLlmsTxt.hint':
    'Use a published /llms-full.txt or /llms.txt when the site has one; a no-op elsewhere.',
  'number.invalid': 'Enter an integer of at least 1.',
  authUser: 'Username',
  'authUser.placeholder': 'Basic Auth username (optional)',
  authPass: 'Password',
  'authPass.placeholder': 'Basic Auth password (optional)',
  'authPass.show': 'Show password',
  'authPass.hide': 'Hide password',
  'auth.hint':
    'Leave blank to send no auth; saved as Authorization: Basic … with every other header preserved.',
  save: 'Save',
  discard: 'Discard',
  reset: 'Reset to defaults',
  dirty: 'unsaved',
  saving: 'Saving…',
  readonly: 'This deployment serves configuration read-only.',
  loading: 'Loading…',
  error: 'Could not read configuration: {message}',
}
