import 'isomorphic-fetch'
import Url        from 'url'
import QS         from 'qs'
import { map }    from 'lodash'
import extendify  from 'extendify'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

const methods = ['get', 'post', 'put', 'patch', 'delete', 'del']

export default class ApiClient {

  static defaults = {
    server: {
      protocol: 'http',
      host: 'localhost',
      pathname: '/',
      port: process.env.API_PORT || process.env.PORT || 5000
    },
    client: {
      pathname: '/'
    }
  };

  static requestDefaults = {
    method        : 'get',
    mode          : 'same-origin',
    credentials   : 'same-origin',
    redirect      : 'follow',
    cache         : 'default',
    as            : 'json',
    headers       : {}
  }

  constructor(options, store, http) {
    if (http) {
      this.req = http.req
      this.res = http.res
    }

    this.store = store
    this.options = merge({}, ApiClient.defaults, options)
    
    methods.forEach(method => {
      this[method] = this.genericMethod.bind(this, method)
    })
  }

  isExternal(path) {
    return /^https?:\/\//i.test(path)
  }

  buildOptions(method, path, opts) {
    let options = merge({}, ApiClient.requestDefaults, opts)
    let external = this.isExternal(path)

    options.url = this.formatUrl(path)
    
    options.method = method.toUpperCase()

    if (options.method === 'DEL') {
      options.method = 'DELETE'
    }

    if (options.data && !options.body) {
      options.body = options.data
    }

    if (options.body) {
      options.body = (options.body instanceof FormData || typeof options.body === 'string') 
        ? options.body 
        : JSON.stringify(options.body)
    }

    if (options.query) {
      options.url += QS.stringify(options.query)
      delete options.query
    }

    if (options.headers) {
      if (__SERVER__ && this.req.get('cookie')) {
        options.headers.cookie = this.req.get('cookie')
      }

      if (this.options.auth && typeof this.options.auth.getBearer === 'function') {
        let token = this.options.auth.getBearer(this.store)
        if (token && token.length && !external) {
          options.headers['Authorization'] = `Bearer ${token}`
        }
      }

      options.headers = new Headers(options.headers)

      if (options.as === 'json') {
        options.headers.set('Content-Type', 'application/json')
      }

    }
    
    if (external) {
      options.mode = 'cors'
    }

    return options
  }

  genericMethod(method, path, opts = {}) {
    let req = this.req
    let options = this.buildOptions(method, path, opts)
    let url = ''+options.url
    delete options.url
    let request = new Request(url, options)

    return fetch(request).then(response => {
      if (!response.ok) {
        return Promise.reject(response)
      }

      switch(options.as) {
        case 'json':
          return response.json()
        case 'text':
          return response.text()
        case 'blob':
          return response.blob()
        default:
          return response
      }
    })
  }

  formatUrl(path) {
    if (this.isExternal(path)) {
      return path
    }

    const config = { ...(__SERVER__ ? this.options.server : this.options.client) }
    const adjustedPath = path[0] === '/' ? path.slice(1) : path

    if (config.base) {
      config.pathname = config.base
    }

    if (config.host && config.port) {
      config.host = `${config.host}:${config.port}`
    }

    const baseUrl = Url.format(config)

    return baseUrl + adjustedPath
  }
}
