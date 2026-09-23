window.__ModuleLoader__.load({
	id: "dsh-web-search-openserp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
let react = require("react");
let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
let react_jsx_runtime = require("react/jsx-runtime");

//#region src/client/locales.ts
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
const OPENSERP_LOCALE_NS = "web-search-openserp";
/** Simplified Chinese dictionary (the key-set source of truth). */
const zh = {
	title: "OpenSERP 搜索",
	description: "自建 OpenSERP 实例，为 web_search 与网页抓取提供结果。",
	baseURL: "实例地址",
	"baseURL.placeholder": "http://openserp.internal:7000",
	"baseURL.fromEnvironment": "当前由环境变量 {env} 提供：{url}",
	"baseURL.unset": "未配置：请填写实例地址，或设置环境变量 {env}。",
	"baseURL.invalid": "请填写 http:// 或 https:// 开头的地址。",
	search: "搜索",
	"search.hint": "以下设置作用于 web_search。",
	engines: "搜索引擎",
	"engines.hint": "不勾选 = 自动（实例默认引擎）；勾选一个走该引擎的专用接口，勾选多个走 mega 聚合接口去重合并。",
	timeoutMs: "搜索超时（毫秒）",
	"timeoutMs.hint": "一次搜索的资源上限；实例要现开浏览器，冷启动可能需要数秒。",
	maxSnippetChars: "摘要上限（字符）",
	"maxSnippetChars.hint": "每条结果的正文截断长度；开启正文抽取后一页很长，靠它收敛。",
	extract: "搜索时顺带抽取正文",
	"extract.hint": "让实例抓取并抽取每个结果页（extract=1）：内容更完整，但一次搜索会明显变慢。",
	fetch: "抓取",
	"fetch.hint": "以下设置作用于单 URL 的正文抓取。",
	fetchTimeoutMs: "抓取超时（毫秒）",
	"fetchTimeoutMs.hint": "一次单页抓取的资源上限；需要渲染时服务端要现开浏览器。",
	extractMode: "抓取模式",
	"extractMode.inherit": "跟随默认（auto）",
	"extractMode.auto": "auto —— 先普通请求，疑似 JS 壳再渲染",
	"extractMode.fast": "fast —— 从不渲染（单页应用会失败）",
	"extractMode.rendered": "rendered —— 总是渲染（最慢）",
	extractFullPage: "整页抽取（保留导航）",
	"extractFullPage.hint": "关闭时按正文抽取，去掉导航与页面装饰；开启则保留，便于找链接或菜单。",
	extractUseLlmsTxt: "优先 llms.txt",
	"extractUseLlmsTxt.hint": "站点根路径有 /llms-full.txt 或 /llms.txt 时优先使用；其它站点无影响。",
	"number.invalid": "请填写不小于 1 的整数。",
	authUser: "账号",
	"authUser.placeholder": "Basic Auth 用户名（可选）",
	authPass: "密码",
	"authPass.placeholder": "Basic Auth 密码（可选）",
	"authPass.show": "显示密码",
	"authPass.hide": "隐藏密码",
	"auth.hint": "留空则不发送认证；保存后编码为 Authorization: Basic …，其它请求头原样保留。",
	save: "保存",
	discard: "放弃更改",
	reset: "恢复默认",
	dirty: "未保存",
	saving: "保存中…",
	readonly: "当前部署的配置为只读。",
	loading: "加载中…",
	error: "读取配置失败：{message}"
};
/** English dictionary, checked complete against the zh key set. */
const en = {
	title: "OpenSERP search",
	description: "A self-hosted OpenSERP instance backing web_search and page fetch.",
	baseURL: "Instance URL",
	"baseURL.placeholder": "http://openserp.internal:7000",
	"baseURL.fromEnvironment": "Currently supplied by {env}: {url}",
	"baseURL.unset": "Not configured — set an instance URL, or export {env}.",
	"baseURL.invalid": "Enter an http:// or https:// URL.",
	search: "Search",
	"search.hint": "These settings shape web_search.",
	engines: "Search engines",
	"engines.hint": "Leave all unchecked for automatic (instance default); one engine uses its dedicated route, several use the mega route, which merges and deduplicates.",
	timeoutMs: "Search timeout (ms)",
	"timeoutMs.hint": "Resource backstop for one search; the instance launches a browser, so a cold start takes seconds.",
	maxSnippetChars: "Snippet cap (characters)",
	"maxSnippetChars.hint": "Truncation length per result; an extracted body is a whole page, and this is what bounds it.",
	extract: "Extract page bodies during search",
	"extract.hint": "Ask the instance to fetch and extract every result (extract=1): richer text, markedly slower search.",
	fetch: "Fetch",
	"fetch.hint": "These settings shape single-URL extraction.",
	fetchTimeoutMs: "Fetch timeout (ms)",
	"fetchTimeoutMs.hint": "Resource backstop for one single-URL extraction; a rendered fetch launches a browser.",
	extractMode: "Extraction mode",
	"extractMode.inherit": "Instance default (auto)",
	"extractMode.auto": "auto — plain HTTP first, render only a JS shell",
	"extractMode.fast": "fast — never render (single-page apps fail)",
	"extractMode.rendered": "rendered — always render (slowest)",
	extractFullPage: "Full-page extraction (keep navigation)",
	"extractFullPage.hint": "Off runs article extraction, stripping navigation and landing furniture; on keeps them, which is what an agent hunting a link needs.",
	extractUseLlmsTxt: "Prefer llms.txt",
	"extractUseLlmsTxt.hint": "Use a published /llms-full.txt or /llms.txt when the site has one; a no-op elsewhere.",
	"number.invalid": "Enter an integer of at least 1.",
	authUser: "Username",
	"authUser.placeholder": "Basic Auth username (optional)",
	authPass: "Password",
	"authPass.placeholder": "Basic Auth password (optional)",
	"authPass.show": "Show password",
	"authPass.hide": "Hide password",
	"auth.hint": "Leave blank to send no auth; saved as Authorization: Basic … with every other header preserved.",
	save: "Save",
	discard: "Discard",
	reset: "Reset to defaults",
	dirty: "unsaved",
	saving: "Saving…",
	readonly: "This deployment serves configuration read-only.",
	loading: "Loading…",
	error: "Could not read configuration: {message}"
};

//#endregion
//#region src/client/openserp-store.ts
/**
* Card state over the plugin's own gateway.
*
* The section rides `connection.rpc` → `/api/web-search-openserp/{get,set,reset}`
* rather than the generic settings API, because the API proxy serves only an
* allowlist of namespaces and a third-party one is not on it. See the host
* gateway module for why that is the sanctioned route rather than a workaround.
*
* The editable vocabulary is declared here rather than imported from
* `src/config.ts` or `src/fetch.ts`: those modules reach `@deepseek-ai/dsh-web`
* (a runtime dependency of the providers), and a value import of them would
* pull a server package into the browser bundle. Types and constants that must
* agree with the host are mirrored, with the coupling named.
*
* @module dsh-web-search-openserp/client/openserp-store
*/
/**
* The engines the card offers, in the host's own order (`OPENSERP_KNOWN_ENGINES`).
*
* Mirrored rather than imported for the bundle reason in the module note.
* `bing` stays on the list because the instance can address it, but the host's
* documented default set excludes it: measured against a Chinese query it
* returned unrelated results, so it costs a slot without adding signal.
*/
const ENGINE_CHOICES = [
	{
		value: "baidu",
		label: "百度"
	},
	{
		value: "google",
		label: "Google"
	},
	{
		value: "duckduckgo",
		label: "DuckDuckGo"
	},
	{
		value: "bing",
		label: "必应（Bing）"
	},
	{
		value: "yandex",
		label: "Yandex"
	},
	{
		value: "ecosia",
		label: "Ecosia"
	}
];
/** The `/extract` modes the card offers, in escalating cost order. */
const EXTRACT_MODE_CHOICES = [
	{
		value: "",
		labelKey: "extractMode.inherit"
	},
	{
		value: "auto",
		labelKey: "extractMode.auto"
	},
	{
		value: "fast",
		labelKey: "extractMode.fast"
	},
	{
		value: "rendered",
		labelKey: "extractMode.rendered"
	}
];
const EMPTY_DRAFT = {
	baseURL: "",
	engines: [],
	timeoutMs: "",
	maxSnippetChars: "",
	extract: false,
	fetchTimeoutMs: "",
	extractMode: "",
	extractFullPage: false,
	extractUseLlmsTxt: false,
	authUser: "",
	authPass: ""
};
const EMPTY = {
	status: "loading",
	stored: { ...EMPTY_DRAFT },
	draft: { ...EMPTY_DRAFT },
	storedHeaders: {},
	baseURLSource: "none",
	baseURLEnvVar: "OPENSERP_URL",
	writable: false,
	saving: false
};
/**
* Turn one base64 credential payload back into text.
*
* `atob` alone hands back a binary string, so a credential whose bytes are not
* Latin-1 — any non-English username or password — would read as mojibake in
* the form and be double-encoded on the next save. The bytes are decoded as
* UTF-8, which is what {@link encodeBasicAuth} wrote and what RFC 7617 asks a
* server to expect.
*
* A payload that is not valid UTF-8 is a credential stored by some other tool
* in some other charset; the raw binary reading is returned rather than a
* string full of U+FFFD, and because the card only writes a field the user
* actually edited, an untouched legacy credential is never rewritten.
* @param encoded - the base64 payload after the `Basic ` scheme.
* @returns the decoded text, or `undefined` when the payload is not base64.
*/
function decodeBasicAuth(encoded) {
	let binary;
	try {
		binary = atob(encoded);
	} catch {
		return;
	}
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return binary;
	}
}
/**
* Read the Basic Auth credential back from a stored `Authorization` header.
*
* The header stores `Basic <base64(user:pass)>`; the card edits the plain
* user/pass form and re-encodes on save. A header that is not `Basic`-shaped
* is left alone — it may be a bearer token or some other scheme the card has
* no business parsing.
* @param headers - the stored headers section.
* @returns the plain user/pass pair, empty when no editable credential is present.
*/
function basicAuthFromHeaders(headers) {
	const authorization = headers?.Authorization;
	if (typeof authorization !== "string") return {
		authUser: "",
		authPass: ""
	};
	const match = /^Basic\s+(.+)$/.exec(authorization.trim());
	if (match === null) return {
		authUser: "",
		authPass: ""
	};
	const encoded = match[1];
	if (encoded === void 0) return {
		authUser: "",
		authPass: ""
	};
	const decoded = decodeBasicAuth(encoded.trim());
	if (decoded === void 0) return {
		authUser: "",
		authPass: ""
	};
	const separator = decoded.indexOf(":");
	return separator === -1 ? {
		authUser: decoded,
		authPass: ""
	} : {
		authUser: decoded.slice(0, separator),
		authPass: decoded.slice(separator + 1)
	};
}
/**
* Encode one credential pair for the `Authorization` header.
*
* Not `btoa(user + ':' + pass)`: `btoa` throws on every code point above
* U+00FF, and a password is exactly where a non-Latin-1 character turns up.
* The bytes are UTF-8 first, which is what RFC 7617 asks a server to expect.
* @param user - the username as typed.
* @param pass - the password as typed.
* @returns the header value, without the `Basic ` prefix.
*/
function encodeBasicAuth(user, pass) {
	const bytes = new TextEncoder().encode(`${user}:${pass}`);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}
/** Whether two engine selections are equal, ignoring order. */
function sameEngines(a, b) {
	if (a.length !== b.length) return false;
	const set = new Set(a);
	return b.every((engine) => set.has(engine));
}
/** Render a stored count as a field value; a missing count reads as empty. */
function countValue(value) {
	return value === void 0 ? "" : String(value);
}
/** The count fields, as `[draft key, wire key]`. */
const COUNT_FIELDS = [
	["timeoutMs", "timeoutMs"],
	["maxSnippetChars", "maxSnippetChars"],
	["fetchTimeoutMs", "fetchTimeoutMs"]
];
/** The boolean fields the card edits. */
const TOGGLE_FIELDS = [
	"extract",
	"extractFullPage",
	"extractUseLlmsTxt"
];
/**
* Plan the write a save would perform, and by construction decide dirtiness.
*
* One function rather than a `isDirty` predicate plus a `buildPatch` function:
* two implementations drift, and the failure mode is a save that writes
* something the "unsaved" indicator never promised (or promises an edit it then
* refuses to write).
* @param state - the card's current stored/draft pair.
* @returns the patch and the removal list; both empty means nothing to save.
*/
function planSave(state) {
	const { draft, stored } = state;
	const patch = {};
	const unset = [];
	const baseURL = draft.baseURL.trim();
	if (baseURL !== stored.baseURL) {
		if (baseURL.length === 0) unset.push("baseURL");
		else patch["baseURL"] = baseURL;
	}
	if (!sameEngines(draft.engines, stored.engines)) {
		if (draft.engines.length === 0) unset.push("engines");
		else patch["engines"] = [...draft.engines];
	}
	for (const [key] of COUNT_FIELDS) {
		const typed = draft[key].trim();
		if (typed === stored[key]) continue;
		if (typed.length === 0) unset.push(key);
		else patch[key] = Number(typed);
	}
	for (const key of TOGGLE_FIELDS) if (draft[key] !== stored[key]) patch[key] = draft[key];
	if (draft.extractMode !== stored.extractMode) {
		if (draft.extractMode === "") unset.push("extractMode");
		else patch["extractMode"] = draft.extractMode;
	}
	if (draft.authUser !== stored.authUser || draft.authPass !== stored.authPass) {
		const { Authorization: _stored, ...kept } = state.storedHeaders;
		const headers = { ...kept };
		if (draft.authUser !== "" || draft.authPass !== "") headers["Authorization"] = `Basic ${encodeBasicAuth(draft.authUser, draft.authPass)}`;
		if (Object.keys(headers).length === 0) unset.push("headers");
		else patch["headers"] = headers;
	}
	return {
		patch,
		unset
	};
}
/** Whether a draft differs from what the host stores. */
function isDirty(state) {
	const { patch, unset } = planSave(state);
	return Object.keys(patch).length > 0 || unset.length > 0;
}
/**
* Accept only an absolute http(s) URL, or empty (meaning "inherit").
*
* The instance rejects a malformed *path* loudly but accepts any well-formed
* URL, so a typo in the address surfaces only as a failing search much later.
* Catching it at the form is the earliest honest moment.
* @param value - the draft URL.
* @returns true when the value is usable.
*/
function isValidBaseURL(value) {
	const trimmed = value.trim();
	if (trimmed.length === 0) return true;
	let url;
	try {
		url = new URL(trimmed);
	} catch {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
}
/**
* Accept a positive whole number, or empty (meaning "inherit").
*
* The schema would reject `0` and `1.5` too, but only after the write, as an
* opaque refusal; a form that says which field is wrong before submitting is
* the point of validating here.
* @param value - the draft count.
* @returns true when the value is usable.
*/
function isValidCount(value) {
	const trimmed = value.trim();
	if (trimmed.length === 0) return true;
	return /^\d+$/.test(trimmed) && Number(trimmed) >= 1;
}
/** Whether every field the card validates would be accepted by a save. */
function isSavable(state) {
	return isValidBaseURL(state.draft.baseURL) && isValidCount(state.draft.timeoutMs) && isValidCount(state.draft.maxSnippetChars) && isValidCount(state.draft.fetchTimeoutMs);
}
/**
* Unwrap one endpoint result, turning a refusal into a throw.
* @param result - the envelope the channel returned.
* @returns the host's settings view.
*/
function unwrap(result) {
	if (!result.ok) throw new Error(result.error?.message ?? "the request was refused");
	const value = result.value;
	if (typeof value !== "object" || value === null) throw new Error("the endpoint returned no settings view");
	return value;
}
/** Owns the card's state and the three gateway calls. */
var OpenserpSettingsController = class {
	rpc;
	store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(EMPTY);
	constructor(rpc) {
		this.rpc = rpc;
	}
	/** Read the section and reset drafts to it. */
	async load() {
		try {
			this.adopt(unwrap(await this.rpc.call("/api", "web-search-openserp/get", { args: {} })));
		} catch (error) {
			this.store.update((state) => {
				state.status = "failed";
				state.error = error instanceof Error ? error.message : String(error);
			});
		}
	}
	/** Stage a text or number field without writing it. */
	edit(field, value) {
		this.store.update((state) => {
			state.draft[field] = value;
		});
	}
	/** Stage the extraction mode. */
	editExtractMode(value) {
		this.store.update((state) => {
			state.draft.extractMode = value;
		});
	}
	/** Flip one boolean field in the draft. */
	toggle(field, value) {
		this.store.update((state) => {
			state.draft[field] = value;
		});
	}
	/** Toggle one engine in the draft selection. */
	toggleEngine(engine) {
		this.store.update((state) => {
			const { engines } = state.draft;
			state.draft.engines = engines.includes(engine) ? engines.filter((value) => value !== engine) : [...engines, engine];
		});
	}
	/** Drop staged edits. */
	discard() {
		this.store.update((state) => {
			state.draft = {
				...state.stored,
				engines: [...state.stored.engines]
			};
		});
	}
	/** Write the staged fields. */
	async save() {
		const snapshot = this.store.getSnapshot();
		if (!isSavable(snapshot)) return;
		const { patch, unset } = planSave(snapshot);
		if (Object.keys(patch).length === 0 && unset.length === 0) return;
		this.store.update((state) => {
			state.saving = true;
			state.error = void 0;
		});
		try {
			this.adopt(unwrap(await this.rpc.call("/api", "web-search-openserp/set", { args: {
				patch,
				unset: [...unset]
			} })));
		} catch (error) {
			this.store.update((state) => {
				state.saving = false;
				state.error = error instanceof Error ? error.message : String(error);
			});
		}
	}
	/** Clear the user layer so the section re-inherits composition defaults. */
	async reset() {
		this.store.update((state) => {
			state.saving = true;
			state.error = void 0;
		});
		try {
			this.adopt(unwrap(await this.rpc.call("/api", "web-search-openserp/reset", { args: {} })));
		} catch (error) {
			this.store.update((state) => {
				state.saving = false;
				state.error = error instanceof Error ? error.message : String(error);
			});
		}
	}
	/** Fold one host view into state, clearing drafts and transient flags. */
	adopt(view) {
		const value = view.value;
		const headers = value.headers ?? {};
		const stored = {
			baseURL: value.baseURL ?? "",
			engines: Array.isArray(value.engines) ? [...value.engines] : [],
			timeoutMs: countValue(value.timeoutMs),
			maxSnippetChars: countValue(value.maxSnippetChars),
			extract: value.extract ?? false,
			fetchTimeoutMs: countValue(value.fetchTimeoutMs),
			extractMode: value.extractMode ?? "",
			extractFullPage: value.extractFullPage ?? false,
			extractUseLlmsTxt: value.extractUseLlmsTxt ?? false,
			...basicAuthFromHeaders(headers)
		};
		this.store.update((state) => {
			state.status = "ready";
			state.error = void 0;
			state.saving = false;
			state.stored = stored;
			state.draft = {
				...stored,
				engines: [...stored.engines]
			};
			state.storedHeaders = { ...headers };
			state.effectiveBaseURL = view.effectiveBaseURL;
			state.baseURLSource = view.baseURLSource;
			state.baseURLEnvVar = view.baseURLEnvVar;
			state.writable = view.writable;
		});
	}
};

//#endregion
//#region src/client/OpenserpCard.tsx
/**
* The `web-search-openserp` card on the settings "plugin configuration" page.
*
* The upstream client face exports no reusable card component, so the chrome is
* self-drawn the way `dsh-llm-fallbacks` draws it: a collapsible `<li>` whose
* header stacks the plugin name over its description and carries an "unsaved"
* pill, then the form, then Discard / Reset / Save.
*
* Unlike the sibling search cards this one edits every field the schema
* carries, because this plugin owns TWO capabilities over ONE instance: the
* search knobs and the fetch knobs are the same deployment's configuration, and
* a card that hid half of them would send the user to the settings document for
* the other half. The split into two groups is therefore about what each
* setting acts on, not about who owns it.
*
* @module dsh-web-search-openserp/client/OpenserpCard
*/
/**
* Render the OpenSERP settings card.
* @param props - injected controller/hook and the synthesized `t` seat.
* @returns the card element.
*/
function OpenserpCard({ controller, useOpenserpCard, t }) {
	const state = useOpenserpCard((snapshot) => snapshot);
	const [open, setOpen] = (0, react.useState)(false);
	const [showPass, setShowPass] = (0, react.useState)(false);
	(0, react.useEffect)(() => {
		controller.load();
	}, [controller]);
	const dirty = isDirty(state);
	const urlOk = isValidBaseURL(state.draft.baseURL);
	const busy = state.saving;
	const readonly = !state.writable;
	const disabled = busy || readonly;
	const canSave = dirty && !busy && !readonly && isSavable(state);
	/** One checkbox row: control, label, and the explanation under both. */
	const toggle = (field, label, hint) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
		className: "dsw-openserp-card__toggle",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				type: "checkbox",
				checked: state.draft[field],
				disabled,
				onChange: (event) => controller.toggle(field, event.target.checked)
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }),
			hint === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: hint })
		]
	}, field);
	/** One millisecond/character bound, with its own validity notice. */
	const count = (field, label, hint) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
		className: "dsw-openserp-card__field",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				type: "number",
				min: 1,
				step: 1,
				inputMode: "numeric",
				value: state.draft[field],
				disabled,
				onChange: (event) => controller.edit(field, event.target.value)
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: hint }),
			isValidCount(state.draft[field]) ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
				role: "alert",
				children: t("number.invalid")
			})
		]
	}, field);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
		className: "dsw-openserp-card",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "dsw-openserp-card__header",
			"aria-expanded": open,
			onClick: () => setOpen((value) => !value),
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: "dsw-openserp-card__heading",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsw-openserp-card__title",
						children: t("title")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsw-openserp-card__description",
						children: t("description")
					})]
				}),
				dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, { children: t("dirty") }) : null,
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					className: `dsw-openserp-card__chevron${open ? " dsw-openserp-card__chevron--open" : ""}`,
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M4 6l4 4 4-4",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.5",
						strokeLinecap: "round",
						strokeLinejoin: "round"
					})
				})
			]
		}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dsw-openserp-card__body",
			children: [
				state.status === "loading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("loading") }) : null,
				state.status === "failed" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: t("error", { message: state.error ?? "" })
				}) : null,
				readonly && state.status === "ready" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("readonly") }) : null,
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: "dsw-openserp-card__field",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("baseURL") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
							type: "url",
							inputMode: "url",
							spellCheck: false,
							value: state.draft.baseURL,
							placeholder: t("baseURL.placeholder"),
							disabled,
							onChange: (event) => controller.edit("baseURL", event.target.value)
						}),
						state.draft.baseURL.trim() === "" && state.baseURLSource === "environment" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("baseURL.fromEnvironment", {
							env: state.baseURLEnvVar,
							url: state.effectiveBaseURL ?? ""
						}) }) : null,
						state.draft.baseURL.trim() === "" && state.baseURLSource === "none" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
							role: "alert",
							children: t("baseURL.unset", { env: state.baseURLEnvVar })
						}) : null,
						!urlOk ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
							role: "alert",
							children: t("baseURL.invalid")
						}) : null
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					className: "dsw-openserp-card__field dsw-openserp-card__group",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("search") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("search.hint") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsw-openserp-card__field dsw-openserp-card__engines",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("engines") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("engines.hint") }),
								ENGINE_CHOICES.map((choice) => {
									const checked = state.draft.engines.includes(choice.value);
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dsw-openserp-card__engine",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked,
											disabled,
											onChange: () => controller.toggleEngine(choice.value)
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: choice.label })]
									}, choice.value);
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsw-openserp-card__numbers",
							children: [count("timeoutMs", t("timeoutMs"), t("timeoutMs.hint")), count("maxSnippetChars", t("maxSnippetChars"), t("maxSnippetChars.hint"))]
						}),
						toggle("extract", t("extract"), t("extract.hint"))
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					className: "dsw-openserp-card__field dsw-openserp-card__group",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("fetch") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("fetch.hint") }),
						count("fetchTimeoutMs", t("fetchTimeoutMs"), t("fetchTimeoutMs.hint")),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: "dsw-openserp-card__field",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("extractMode") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								value: state.draft.extractMode,
								disabled,
								onChange: (event) => controller.editExtractMode(event.target.value),
								children: EXTRACT_MODE_CHOICES.map((choice) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: choice.value,
									children: t(choice.labelKey)
								}, choice.value))
							})]
						}),
						toggle("extractFullPage", t("extractFullPage"), t("extractFullPage.hint")),
						toggle("extractUseLlmsTxt", t("extractUseLlmsTxt"), t("extractUseLlmsTxt.hint"))
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: "dsw-openserp-card__field",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("authUser") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
						type: "text",
						inputMode: "text",
						autoComplete: "username",
						spellCheck: false,
						value: state.draft.authUser,
						placeholder: t("authUser.placeholder"),
						disabled,
						onChange: (event) => controller.edit("authUser", event.target.value)
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: "dsw-openserp-card__field",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("authPass") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dsw-openserp-card__secret",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
								type: showPass ? "text" : "password",
								autoComplete: "current-password",
								spellCheck: false,
								value: state.draft.authPass,
								placeholder: t("authPass.placeholder"),
								disabled,
								onChange: (event) => controller.edit("authPass", event.target.value)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsw-openserp-card__reveal",
								"aria-label": t(showPass ? "authPass.hide" : "authPass.show"),
								"aria-pressed": showPass,
								disabled,
								onClick: (event) => {
									event.preventDefault();
									setShowPass((value) => !value);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
									viewBox: "0 0 16 16",
									"aria-hidden": "true",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "M8 3.2C4.6 3.2 1.9 5.6 1.2 8c.7 2.4 3.4 4.8 6.8 4.8s6.1-2.4 6.8-4.8c-.7-2.4-3.4-4.8-6.8-4.8Z",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.3"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
											cx: "8",
											cy: "8",
											r: "2.1",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.3"
										}),
										showPass ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "M3 13 13 3",
											stroke: "currentColor",
											strokeWidth: "1.3",
											strokeLinecap: "round"
										})
									]
								})
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("auth.hint") })
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsw-openserp-card__footer",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							disabled: !dirty || busy,
							onClick: () => controller.discard(),
							children: t("discard")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled,
							onClick: () => void controller.reset(),
							children: t("reset")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							disabled: !canSave,
							onClick: () => void controller.save(),
							children: busy ? t("saving") : t("save")
						})
					]
				})
			]
		}) : null]
	});
}

//#endregion
//#region src/client/styles.ts
/**
* Card styles, injected as one plugin-owned `<style>` tag.
*
* The upstream cards use CSS Modules compiled into their bundle. This plugin
* ships one small stylesheet instead: the rule set is a couple of dozen
* selectors, and a CSS-Modules pipeline would add a bundler plugin (hashing,
* virtual ids, the `_<hash>_<local>` identifier contract) to own nothing but
* that. The class names are prefixed instead, which is what the hashing would
* buy here.
*
* Every colour, radius and border comes from the shell's `--dsw-alias-*` tokens
* rather than literals, so the card follows the light/dark theme and any
* future retheme without this package shipping an update.
*
* @module dsh-web-search-openserp/client/styles
*/
/** Attribute the shell uses to reap plugin-owned tags when a bundle unloads. */
const STYLE_TAG_ATTRIBUTE = "data-plugin";
/** Identifier carried on the tag; matches the package name. */
const STYLE_TAG_ID = "dsh-web-search-openserp";
/** The card's stylesheet, mirroring the sibling plugin cards' chrome. */
const CARD_CSS = `
.dsw-openserp-card {
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
  transition: border-color 0.16s, background 0.16s;
}
.dsw-openserp-card:hover { border-color: var(--dsw-alias-label-dimmed); }

.dsw-openserp-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: 0;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.dsw-openserp-card__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}
.dsw-openserp-card__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 21px;
  color: var(--dsw-alias-label-primary);
}
.dsw-openserp-card__description {
  font-size: 13px;
  line-height: 19px;
  color: var(--dsw-alias-label-tertiary);
}

/* Disclosure indicator. The card toggles the --open modifier from its own
   state rather than keying off [aria-expanded], so the rotation has exactly
   one source of truth. 14px matches the built-in cards' chevron. */
.dsw-openserp-card__chevron {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--dsw-alias-label-tertiary);
  transition: transform 0.15s ease;
}
.dsw-openserp-card__chevron--open {
  transform: rotate(180deg);
}
@media (prefers-reduced-motion: reduce) {
  .dsw-openserp-card__chevron {
    transition: none;
  }
}

.dsw-openserp-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsw-openserp-card__body > p {
  margin: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary);
}

/* Both a fieldset (a group) and a label (a single control) wear this class, so
   the box chrome a user agent gives a fieldset is reset here: without it the
   group renders inside a default border that belongs to no design system. */
.dsw-openserp-card__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.dsw-openserp-card__field > span,
.dsw-openserp-card__field > legend {
  padding: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary);
}
/* Password field with a reveal toggle. The wrapper has to out-specify the
   field > span label rule directly above, hence the child selector and the
   explicit resets; the button is absolutely positioned so the input keeps its
   full width while the glyph floats over its right edge. */
.dsw-openserp-card__field > .dsw-openserp-card__secret {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0;
  font-size: inherit;
  color: inherit;
}
.dsw-openserp-card__reveal {
  position: absolute;
  right: 4px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsw-openserp-card__reveal:hover:not(:disabled) {
  color: var(--dsw-alias-label-secondary);
}
.dsw-openserp-card__reveal:disabled {
  cursor: default;
  opacity: 0.5;
}
.dsw-openserp-card__reveal svg {
  width: 16px;
  height: 16px;
}
.dsw-openserp-card__field > small {
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
}
.dsw-openserp-card__field > select {
  padding: 7px 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.dsw-openserp-card__field > select:disabled { cursor: default; opacity: 0.6; }

/* The two groups are what the settings are FOR, not what they are, so each
   gets a hairline rule and a little more air than the fields inside it. */
.dsw-openserp-card__group {
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
.dsw-openserp-card__group > legend {
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.dsw-openserp-card__numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.dsw-openserp-card__numbers > .dsw-openserp-card__field { flex: 1 1 180px; }

.dsw-openserp-card__engines { gap: 8px; }
.dsw-openserp-card__engine {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}
.dsw-openserp-card__engine > input[type="checkbox"] {
  accent-color: var(--dsw-alias-accent, #4f8cff);
  cursor: pointer;
}
.dsw-openserp-card__engine:has(input:disabled) { opacity: 0.6; cursor: default; }

/* Same row shape as an engine checkbox, but the control comes first and the
   explanation hangs under the label text. */
.dsw-openserp-card__toggle {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
}
.dsw-openserp-card__toggle > input[type="checkbox"] {
  accent-color: var(--dsw-alias-accent, #4f8cff);
  cursor: pointer;
}
.dsw-openserp-card__toggle:has(input:disabled) { opacity: 0.6; cursor: default; }
.dsw-openserp-card__toggle > small {
  grid-column: 2;
  font-size: 12px;
  line-height: 17px;
  color: var(--dsw-alias-label-tertiary);
}

.dsw-openserp-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--dsw-alias-border-l2);
}
`;
/**
* Attach the stylesheet, returning the disposer that removes it.
*
* Idempotent: a second call while a tag is already present reuses it, so an
* HMR reload cannot stack duplicates.
* @returns disposer removing the tag this call owns.
*/
function installCardStyles() {
	const selector = `style[${STYLE_TAG_ATTRIBUTE}="${STYLE_TAG_ID}"]`;
	const existing = document.head.querySelector(selector);
	if (existing !== null) return () => existing.remove();
	const tag = document.createElement("style");
	tag.setAttribute(STYLE_TAG_ATTRIBUTE, STYLE_TAG_ID);
	tag.textContent = CARD_CSS;
	document.head.appendChild(tag);
	return () => tag.remove();
}

//#endregion
//#region src/client/index.ts
/**
* Browser half: registers the OpenSERP card into the settings
* "plugin configuration" page (`settings.plugin.item`).
*
* The card reads and writes through the plugin's OWN endpoints
* (`connection.rpc` → `/api/web-search-openserp/*`). The generic settings API
* cannot serve a third-party namespace — `exposedNamespaces()` is an explicit
* allowlist — so this channel is the sanctioned route, not a workaround.
*
* Only value imports listed in the bundle's externals may appear in this
* graph; every other `@deepseek-ai/*` import must be type-only. Violating that
* does not degrade this card — it fails the whole Web UI's plugin load.
*
* @module dsh-web-search-openserp/client
*/
/**
* The cell this card occupies.
*
* `settings.plugin.item` is a keyed slot: its owner enumerates the settings
* namespaces the Host exposes and dispatches one key per namespace, so a card
* is addressed by the namespace it edits. This must therefore equal
* `OPENSERP_SETTINGS_NAMESPACE` in the host half. It is repeated as a literal
* rather than imported because that module pulls in server-side packages that
* have no place in a browser bundle.
*/
const OPENSERP_SETTINGS_KEY = "web-search-openserp";
/**
* Required client services. The card registration waits on the slot
* declaration, so `slots` must be injected rather than read reflectively.
*/
const inject = [
	"slots",
	"locale",
	"connection"
];
/**
* Register the dictionaries and the card once the `settings.plugin.item`
* declaration is on the ledger.
* @param ctx - client root context.
*/
function apply(ctx) {
	ctx.effect(() => installCardStyles(), "web-search-openserp: card styles");
	ctx.effect(() => ctx.locale.register(OPENSERP_LOCALE_NS, {
		zh,
		en
	}), "web-search-openserp: dictionaries");
	const connection = ctx.get("connection");
	const controller = new OpenserpSettingsController(connection.rpc);
	ctx.slots.inject("settings.plugin.item", function* () {
		yield ctx.slots.register({
			name: "settings.plugin.item",
			key: OPENSERP_SETTINGS_KEY,
			locale: OPENSERP_LOCALE_NS,
			inject: () => ({
				controller,
				hooks: { openserpCard: controller.store }
			})
		}, OpenserpCard);
	});
}

//#endregion
exports.ENGINE_CHOICES = ENGINE_CHOICES;
exports.EXTRACT_MODE_CHOICES = EXTRACT_MODE_CHOICES;
exports.OPENSERP_LOCALE_NS = OPENSERP_LOCALE_NS;
exports.OpenserpCard = OpenserpCard;
exports.OpenserpSettingsController = OpenserpSettingsController;
exports.apply = apply;
exports.inject = inject;
		return module.exports;
	}
});
