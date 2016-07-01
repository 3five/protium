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
      pathname: '/'
    },
    client: {
      pathname: '/'
    }
  };

  static requestDefaults = {
    method        : 'get',
    mode          : 'same-origin',
    redorect      : 'follow',
    cache         : 'default',
    credentials   : 'include',
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

  buildRequest(method, path, options) {
    let url = this.formatUrl(path)

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

    return new Request(url, merge(
      ApiClient.requestDefaults,
      options
    ))
  }

  genericMethod(method, path, options = {}) {
    let req = this.req
    let request = this.buildRequest(method, path, options)

    return fetch(request).then(response => {
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
    const config = { ...(SERVER ? this.options.server : this.options.client) }
    const adjustedPath = path[0] === '/' ? path : `/${path}`

    if (config.base) {
      config.pathname = config.base
    }

    if (config.host && config.port) {
      config.host = `${config.host}:${config.port}`
    }

    const baseUrl = Url.format(config)
    const url = baseUrl + adjustedPath
    return url
  }
}
