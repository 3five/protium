import Url                from 'url'
import Superagent         from 'superagent'
import { merge }          from 'lodash'

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
  }

  constructor(req, options) {
    this.options = merge({}, ApiClient.defaults, options)
    methods.forEach(method => {
      this[method] = this.genericMethod.bind(this, method)
    })
  }

  genericMethod(method, path, options) {
    if (!options) { options = {} }

    let aborted = false
    let dfd = deferred()
    let request = Superagent[method](this.formatUrl(path))

    if (options.params) {
      request.query(options.params)
    }

    if (SERVER && req.get('cookie')) {
      request.set('cookie', req.get('cookie'))
    }
    
    if (options.data) {
      request.send(options.data)
    } 

    else if (options.attach) {
      let formData = new FormData()
      let files = options.attach

      for (let key in files) {
        if (files.hasOwnProperty(key) && files[key] instanceof File) {
          formData.append(`files`, files[key])
        }
      }

      request.send(formData)
    }

    dfd.promise.abort = function() {
      aborted = true
      request.abort()
    }

    request.end((err, res) => {
      if (!aborted) {
        if (err) {
          return dfd.reject((res && res.body) || err)
        }
        dfd.resolve(res.body)
      }
    })

    return dfd.promise
  }

  formatUrl(path) {
    const config = SERVER ? this.options.server : this.options.client
    const adjustedPath = path[0] === '/' ? path : `/${path}`
    if (config.base) {
      config.pathname = config.base
    }
    const baseUrl = Url.format(config)
    return Url.resolve(baseUrl, adjustedPath)
  }
}

function deferred() {
  let resolve, reject,
  promise = new Promise((_resolve, _reject)=> {
    resolve = _resolve
    reject = _reject
  })
  return {
    promise,
    resolve,
    reject
  }
}