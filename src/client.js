import 'isomorphic-fetch'
import Url      from 'url'
import QS       from 'qs'
import merge    from 'deep-extend'
import { map }  from 'lodash'

const methods = ['get', 'post', 'put', 'patch', 'del']

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
    as            : 'json'
  }

  constructor(options, http) {
    if (http) {
      this.req = http.req
      this.res = http.res
    }

    this.options = merge({}, ApiClient.defaults, options)
    
    methods.forEach(method => {
      this[method] = this.genericMethod.bind(this, method)
    })
  }

  isExternal(path) {
    return /^https?:\/\//i.test(path)
  }

  buildOptions(method, path, options) {
    options.method = method.toUpperCase()

    if (options.body) {
      options.body = JSON.stringify(options.body)
    } else if (options.formData) {
      options.body = new FormData(options.formData)
      delete options.formData
    }

    if (options.query) {
      url += QS.stringify(options.query)
      delete options.query
    }

    if (options.headers) {
      if (__SERVER__ && this.req.get('cookie')) {
        options.headers.cookie = this.req.get('cookie')
      }
      options.headers = new Headers(options.headers)
    }

    let requestOptions = merge(ApiClient.requestDefaults, options)
    
    if (this.isExternal(path)) {
      requestOptions.mode = 'cors'
    }

    return requestOptions
  }

  genericMethod(method, path, options = {}) {
    let req = this.req
    let url = this.formatUrl(path)
    let requestOptions = this.buildOptions(method, path, options)
    let request = new Request(url, requestOptions)

    return fetch(request).then(response => {
      switch(requestOptions.as) {
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
    const adjustedPath = path[0] === '/' ? path : `/${path}`

    if (config.base) {
      config.pathname = config.base
    }

    if (config.host && config.port) {
      config.host = `${config.host}:${config.port}`
    }

    const baseUrl = Url.format(config)
    const url = Url.join(baseUrl, adjustedPath)
    return url
  }
}
