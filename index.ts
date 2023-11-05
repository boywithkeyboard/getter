type ExtractParam<Path, NextPart> = Path extends `$${infer Param}`
  ? Record<`$${Param}`, string> & NextPart
  : NextPart

type ExtractParams<Path> = Path extends `${infer Segment}/${infer Rest}`
  ? ExtractParam<Segment, ExtractParams<Rest>>
  : ExtractParam<Path, {}>

type IsEmpty<T extends Record<string, unknown>> = keyof T extends never ? true : false

type RequestOptions<Path extends string> = {
  headers?: Record<string, string>
  query?: Record<string, QueryParameterValue>
  cookies?: Record<string, string>
  json?: Record<string, unknown> | Array<unknown>
  formData?: Record<string, string>
  buffer?: Uint8Array | ArrayBuffer
  stream?: ReadableStream<unknown>
} & (
  IsEmpty<ExtractParams<Path>> extends false ? { variables: ExtractParams<Path> } : {}
)

type QueryParameterValue =
  | boolean
  | number
  | string
  | Array<boolean | number | string>

type Method =
  | 'delete'
  | 'get'
  | 'head'
  | 'patch'
  | 'post'
  | 'put'

type Route = {
  body?:
    | string
    | Record<string, unknown>
    | Array<unknown>
    | Uint8Array
  headers?: Record<string, string>
  query?: Record<string, QueryParameterValue>
  cookies?: Record<string, string>
}

type Routes = Partial<Record<Method, Record<string, Route>>>

type Path<R extends Routes, M extends Method> = (R[M] extends Record<string, unknown> ? (keyof R[M] extends string ? keyof R[M] : string) : string)

export class Getter<R extends Routes = {}> {
  #global: {
    urlPrefix: string
    urlSuffix: string
    query?: Record<string, QueryParameterValue>
    headers?: Record<string, string>
    cookies?: Record<string, string>
  }

  constructor({
    urlPrefix = '',
    urlSuffix = '',
    query,
    headers,
    cookies
  }: {
    urlPrefix?: string
    urlSuffix?: string
    query?: Record<string, QueryParameterValue>
    headers?: Record<string, string>
    cookies?: Record<string, string>
  } = {}) {
    this.#global = {
      urlPrefix,
      urlSuffix,
      query,
      headers,
      cookies
    }
  }

  async #req(method: string, pathname: string, options?: RequestOptions<string>) {
    let body: BodyInit | null = null
    const searchParams = new URLSearchParams()
    const headers = new Headers()
    const cookies: string[] = []

    if (this.#global.cookies !== undefined) {
      const cookies: string[] = []

      for (const [key, value] of Object.entries(this.#global.cookies))
        cookies.push(`${key}=${value}`)
    }

    if (this.#global.headers !== undefined) {
      for (const key in this.#global.headers)
        headers.set(key, this.#global.headers[key])
    }

    if (this.#global.query !== undefined) {
      for (const key in this.#global.query)
        searchParams.set(
          key,
          (typeof this.#global.query[key] === 'string'
            ? this.#global.query[key]
            : this.#global.query[key] instanceof Array
            ? (this.#global.query[key] as Array<string>).join(',')
            : this.#global.query[key].toString()) as string
        )
    }

    if (options?.cookies !== undefined) {
      const cookies: string[] = []

      for (const [key, value] of Object.entries(cookies))
        cookies.push(`${key}=${value}`)
    }

    if (options?.headers !== undefined) {
      for (const key in options.headers)
        headers.set(key, options.headers[key])
    }

    if (options?.query !== undefined) {
      for (const key in options.query)
        searchParams.set(
          key,
          (typeof options.query[key] === 'string'
            ? options.query[key]
            : options.query[key] instanceof Array
            ? (options.query[key] as Array<string>).join(',')
            : options.query[key].toString()) as string
        )
    }

    if (options?.json !== undefined) {
      body = JSON.stringify(options.json)
      headers.set('content-type', 'application/json')
    } else if (options?.formData !== undefined) {
      const formData = new FormData()

      for (const key in options.formData)
        formData.set(key, options.formData[key])

      body = formData
    } else if (options?.buffer !== undefined) {
      body = options.buffer
    } else if (options?.stream !== undefined) {
      body = options.stream
    }

    headers.set('cookie', cookies.join('; '))

    const response = await fetch(this.#global.urlPrefix + pathname + this.#global.urlSuffix + (searchParams?.toString() ?? ''), {
      method,
      body,
      headers
    })

    return response.ok
      ? {
        data: await response.json(),
        error: undefined,
        code: response.status,
        raw: response
      }
      : {
        data: undefined,
        error: await response.json(),
        code: response.status,
        raw: response
      }
  }

  delete = <P extends Path<R, 'delete'>>(pathname: string, options: RequestOptions<P>) => {
    return this.#req('DELETE', pathname, options)
  }

  get<P extends Path<R, 'get'>>(pathname: string, options: RequestOptions<P>) {
    return this.#req('GET', pathname, options)
  }

  head<P extends Path<R, 'head'>>(pathname: string, options: RequestOptions<P>) {
    return this.#req('HEAD', pathname, options)
  }

  patch<P extends Path<R, 'patch'>>(pathname: string, options: RequestOptions<P>) {
    return this.#req('PATCH', pathname, options)
  }

  post<P extends Path<R, 'post'>>(pathname: P, options: RequestOptions<P>) {
    return this.#req('POST', pathname as string, options)
  }

  put<P extends Path<R, 'put'>>(pathname: string, options: RequestOptions<P>) {
    return this.#req('PUT', pathname, options)
  }
}
