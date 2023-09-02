import { Getter } from './getter.ts'
import { RequestData } from './request_data.ts'
import { RequestMethod } from './request_method.ts'
import { ResponseData } from './response_data.ts'

export class RequestBuilder<M extends RequestMethod> {
  #r: {
    data: RequestData | null
    prefix: string
    suffix: string
    method: RequestMethod
    url: string
    query: Record<string, string>
    headers: Record<string, string>
    cookies: Record<string, string>
  }

  constructor(
    o: ConstructorParameters<typeof Getter>[0],
    m: M,
    u: string,
  ) {
    o ??= {}

    this.#r = {
      data: null,
      prefix: o.prefix ?? '',
      suffix: o.suffix ?? '',
      method: m,
      url: u,
      query: {},
      headers: {},
      cookies: {},
    }
  }

  header(name: string, value: string) {
    this.#r.headers[name] = value

    return this
  }

  query(query: Record<string, string>) {
    this.#r.query = {
      ...this.#r.query,
      ...query,
    }

    return this
  }

  cookie(name: string, value: string) {
    this.#r.cookies[name] = value

    return this
  }

  data(data: string) {
    this.#r.data = data

    return this
  }

  async submit<D extends ResponseData = string>({
    // @ts-ignore:
    as = 'string',
  }: {
    as?: D extends Record<string, unknown> ? 'json'
      : D extends Uint8Array ? 'buffer'
      : D extends FormData ? 'formData'
      : D extends Blob ? 'blob'
      : 'string'
  } = {}) {
    let res: Response

    const h = this.#r.headers

    if (Object.keys(this.#r.cookies).length > 0) {
      for (const key in this.#r.cookies) {
        h['Cookie'] += `; ${key}=${this.#r.cookies[key]}`
      }
    }

    const s = Object.keys(this.#r.query).length > 0
      ? new URLSearchParams(this.#r.query)
      : ''

    try {
      res = await fetch(this.#r.prefix + this.#r.url + this.#r.suffix + s, {
        method: this.#r.method.toUpperCase(),
        body: (this.#r.data === null || this.#r.data instanceof Uint8Array ||
            this.#r.data instanceof FormData ||
            this.#r.data instanceof Blob || typeof this.#r.data === 'string')
          ? this.#r.data
          : JSON.stringify(this.#r.data),
        headers: h,
      })
    } catch (_) {
      res = new Response(null, {
        status: 400,
      })
    }

    let data

    try {
      switch (as) {
        case 'json':
          data = await res.json()
          break
        case 'buffer':
          data = new Uint8Array(await res.arrayBuffer())
          break
        case 'formData':
          data = await res.formData()
          break
        case 'blob':
          data = await res.blob()
          break
        case 'string':
          data = await res.text()
          break
      }
    } catch (_) {
      //
    }

    return {
      data,
      headers: res.headers,
      code: res.status,
      ok: res.ok,
    }
  }
}
