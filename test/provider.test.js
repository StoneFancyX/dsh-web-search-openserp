import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  OPENSERP_PROVIDER_ID,
  OpenserpSearchProvider,
  isAdURL,
  isNonResultType,
  mapOpenserpResponse,
} from '../lib/provider.js'
import { OPENSERP_FETCH_PROVIDER_ID, OpenserpFetchProvider } from '../lib/fetch.js'

const SEARCH_OPTIONS = { timeoutMs: 20_000, maxSnippetChars: 500, extract: false }
const provider = (options) =>
  new OpenserpSearchProvider(() => ({ ...SEARCH_OPTIONS, ...options }))

const FETCH_OPTIONS = {
  timeoutMs: 30_000,
  mode: 'auto',
  fullPage: false,
  useLlmsTxt: false,
}
const fetcher = (options) => new OpenserpFetchProvider(() => ({ ...FETCH_OPTIONS, ...options }))

/** Run `body` with `globalThis.fetch` replaced, restoring it afterwards. */
async function withFetch(impl, body) {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    return await body()
  } finally {
    globalThis.fetch = original
  }
}

describe('provider ids', () => {
  it('are the ids a deployment names in web.searchProvider / web.fetchProvider', () => {
    assert.equal(OPENSERP_PROVIDER_ID, 'openserp')
    assert.equal(OPENSERP_FETCH_PROVIDER_ID, 'openserp')
  })
})

describe('available()', () => {
  it('accepts an http(s) base URL', () => {
    assert.equal(provider({ baseURL: 'http://openserp:7000' }).available(), true)
    assert.equal(provider({ baseURL: 'https://openserp.example.com' }).available(), true)
    assert.equal(fetcher({ baseURL: 'http://openserp:7000' }).available(), true)
  })

  it('reports unavailable rather than throwing on a missing or unusable base URL', () => {
    for (const baseURL of [undefined, '', '   ', 'not a url', 'ftp://s', 'file:///etc/passwd']) {
      assert.equal(provider({ baseURL }).available(), false, `search: ${String(baseURL)}`)
      assert.equal(fetcher({ baseURL }).available(), false, `fetch: ${String(baseURL)}`)
    }
  })

  it('reads the options thunk on every call, so a settings edit takes effect live', () => {
    // The settings section is projected per operation; capturing it at
    // construction would strand the provider on the boot-time value.
    let baseURL
    const live = new OpenserpSearchProvider(() => ({ ...SEARCH_OPTIONS, baseURL }))

    assert.equal(live.available(), false)
    baseURL = 'http://configured-later:7000'
    assert.equal(live.available(), true)
  })
})

describe('isNonResultType()', () => {
  it('flags sponsored rows and SERP furniture', () => {
    for (const type of ['ad', 'answer_box', 'related_searches']) {
      assert.equal(isNonResultType(type), true, type)
    }
  })

  it('leaves an ordinary result alone, including an absent type', () => {
    for (const type of [undefined, '', 'organic', 'video']) {
      assert.equal(isNonResultType(type), false, String(type))
    }
  })
})

describe('isAdURL()', () => {
  it('flags the baidu redirect host that only ever wraps a placement', () => {
    // Measured: a sponsored row arrived as type "organic" with ad null, titled
    // "Python asyncio 官方文档" while pointing at this host.
    assert.equal(isAdURL('http://nourl.ubs.baidu.com/61344'), true)
    assert.equal(isAdURL('https://nourl.ubs.baidu.com/99?x=1'), true)
  })

  it('flags the baidu.php redirect shape seen on live SERPs', () => {
    assert.equal(isAdURL('https://www.baidu.com/baidu.php?url=Kf0000K5cNxA6dzi'), true)
  })

  it('does NOT flag baidu.com/link, which also carries genuine results', () => {
    // A real hit (a Tsinghua University Press book page) arrived through this
    // redirect in the same SERP as an ad; blocklisting it would drop good rows.
    assert.equal(isAdURL('http://www.baidu.com/link?url=VrCBwq78gVcLy1Rc'), false)
  })

  it('leaves ordinary URLs and the empty string alone', () => {
    for (const url of ['', 'https://github.com/karust/openserp', 'https://docs.python.org/3/']) {
      assert.equal(isAdURL(url), false, url)
    }
  })
})

describe('mapOpenserpResponse()', () => {
  const body = (results) => ({ meta: {}, query: {}, results })

  it('normalises results into sources, dropping absent optional fields', () => {
    const out = mapOpenserpResponse(
      body([
        { url: 'https://a.test/1', title: 'A', snippet: 'excerpt a' },
        { url: 'https://b.test/2', title: 'B' },
      ]),
      500,
    )

    assert.deepEqual(out.sources, [
      { url: 'https://a.test/1', title: 'A', snippet: 'excerpt a' },
      { url: 'https://b.test/2', title: 'B' },
    ])
    assert.equal(out.truncated, false)
    assert.equal(out.content, undefined)
  })

  it('drops a row on any one of the four independent signals', () => {
    const out = mapOpenserpResponse(
      body([
        { url: 'https://keep.test/1', title: 'kept' },
        { url: 'https://ad-type.test/', type: 'ad', title: 'typed ad' },
        { url: 'https://ad-flag.test/', ad: true, title: 'flagged ad' },
        { url: 'https://furniture.test/', type: 'related_searches', title: 'furniture' },
        { url: 'http://nourl.ubs.baidu.com/61344', title: 'disguised ad' },
      ]),
      500,
    )

    assert.deepEqual(
      out.sources.map((s) => s.url),
      ['https://keep.test/1'],
    )
  })

  it('deduplicates by URL, keeping the first occurrence', () => {
    const out = mapOpenserpResponse(
      body([
        { url: 'https://dup.test/', title: 'first' },
        { url: 'https://dup.test/', title: 'second' },
      ]),
      500,
    )

    assert.equal(out.sources.length, 1)
    assert.equal(out.sources[0].title, 'first')
  })

  it('caps a snippet at the configured length', () => {
    const out = mapOpenserpResponse(
      body([{ url: 'https://long.test/', snippet: 'x'.repeat(50) }]),
      10,
    )
    assert.equal(out.sources[0].snippet, 'x'.repeat(10))
  })

  it('never splits a surrogate pair when capping', () => {
    // 5 astral characters = 10 UTF-16 units; a cap of 5 would land between the
    // halves of the third pair, so the orphaned high surrogate must be dropped.
    const out = mapOpenserpResponse(body([{ url: 'https://emoji.test/', snippet: '😀'.repeat(5) }]), 5)
    const snippet = out.sources[0].snippet
    assert.equal(snippet, '😀'.repeat(2))
    assert.equal(/[\uD800-\uDBFF]$/.test(snippet), false)
  })

  it('prefers the extracted body over the engine excerpt', () => {
    const out = mapOpenserpResponse(
      body([
        {
          url: 'https://extracted.test/',
          snippet: 'teaser',
          extracted: { content: 'full body', format: 'markdown' },
        },
      ]),
      500,
    )
    assert.equal(out.sources[0].snippet, 'full body')
  })

  it('falls back to the excerpt when extraction returned nothing', () => {
    const out = mapOpenserpResponse(
      body([{ url: 'https://thin.test/', snippet: 'teaser', extracted: null }]),
      500,
    )
    assert.equal(out.sources[0].snippet, 'teaser')
  })

  it('tolerates a malformed body rather than throwing', () => {
    for (const payload of [{}, { results: null }, { results: 'nope' }, { results: [null, 7, 'x'] }]) {
      const out = mapOpenserpResponse(payload, 500)
      assert.deepEqual(out.sources, [])
      assert.equal(out.truncated, false)
    }
  })
})

describe('fetch provider', () => {
  const okResponse = (payload) =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })

  it('prefers markdown over plain text', async () => {
    const out = await withFetch(
      async () => okResponse({ url: 'https://page.test/', markdown: '# md', text: 'plain' }),
      () => fetcher({ baseURL: 'http://openserp:7000' }).fetch({ url: 'https://page.test/' }),
    )

    assert.equal(out.body.kind, 'text')
    assert.equal(out.body.content, '# md')
    assert.equal(out.url, 'https://page.test/')
  })

  it('falls back to plain text when markdown is absent', async () => {
    const out = await withFetch(
      async () => okResponse({ url: 'https://page.test/', text: 'plain only' }),
      () => fetcher({ baseURL: 'http://openserp:7000' }).fetch({ url: 'https://page.test/' }),
    )
    assert.equal(out.body.content, 'plain only')
  })

  it('always reports kind text, because the instance cleans the page first', async () => {
    const out = await withFetch(
      async () => okResponse({ url: 'https://page.test/', markdown: 'body' }),
      () => fetcher({ baseURL: 'http://openserp:7000' }).fetch({ url: 'https://page.test/' }),
    )
    assert.equal(out.body.kind, 'text')
  })

  it('surfaces a private-network refusal as WEB_PROVIDER_ERROR with the instance reason', async () => {
    const refusal = new Response(
      JSON.stringify({ error: 'bad_request', message: 'private network' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )

    await assert.rejects(
      withFetch(
        async () => refusal,
        () => fetcher({ baseURL: 'http://openserp:7000' }).fetch({ url: 'http://127.0.0.1/' }),
      ),
      (error) => {
        assert.equal(error.code, 'WEB_PROVIDER_ERROR')
        assert.match(error.message, /HTTP 400/)
        assert.match(error.message, /private-network/)
        return true
      },
    )
  })

  it('rejects a non-JSON body, which means the base URL is not the instance root', async () => {
    const html = new Response('<html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })

    await assert.rejects(
      withFetch(
        async () => html,
        () => fetcher({ baseURL: 'http://wrong-host:7000' }).fetch({ url: 'https://page.test/' }),
      ),
      (error) => {
        assert.equal(error.code, 'WEB_PROVIDER_ERROR')
        assert.match(error.message, /instead of JSON/)
        return true
      },
    )
  })
})
