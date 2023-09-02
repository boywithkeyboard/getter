import { RequestBuilder } from './request_builder.ts'

export class Getter {
  #options

  constructor(options?: {
    prefix?: string
    suffix?: string
    defaultQuery?: Record<string, string>
    defaultHeaders?: Record<string, string>
    defaultCookies?: Record<string, string>
  }) {
    this.#options = options
  }

  delete(url: string) {
    return new RequestBuilder(this.#options, 'delete', url)
  }

  get(url: string): Omit<RequestBuilder<'get'>, 'data'> {
    return (new RequestBuilder(this.#options, 'get', url) as unknown) as Omit<
      RequestBuilder<'get'>,
      'data'
    >
  }

  head(
    url: string,
  ): Omit<RequestBuilder<'head'>, 'data'> {
    return (new RequestBuilder(this.#options, 'head', url) as unknown) as Omit<
      RequestBuilder<'head'>,
      'data'
    >
  }

  patch(url: string) {
    return new RequestBuilder(this.#options, 'patch', url)
  }

  post(url: string) {
    return new RequestBuilder(this.#options, 'post', url)
  }

  put(url: string) {
    return new RequestBuilder(this.#options, 'put', url)
  }
}
