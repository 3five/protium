import Url                from 'url'
import Superagent         from 'superagent'
import { merge, map }          from 'lodash'

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
    this.req = req
    this.options = merge({}, ApiClient.defaults, options)
    methods.forEach(method => {
      this[method] = this.genericMethod.bind(this, method)
    })
  }

  genericMethod(method, path, options) {
    if (!options) { options = {} }

    let req = this.req
    let aborted = false
    let dfd = deferred()
    let request = Superagent[method](this.formatUrl(path))

    if (options.query) {
      request.query(options.query)
    }

    if (SERVER && req.get('cookie')) {
      request.set('cookie', req.get('cookie'))
    }
    
    if (options.data) {
      request.send(options.data)
    } 

    else if (options.attach) {
      let form = new FormData()
      let files = options.attach

      map(files, (val, key)=> {
        if (val instanceof FileList) {
          for (let f in val) {
            if (val.hasOwnProperty(f) && val[f] instanceof File) {
              form.append(key, val[f])
            }
          }
          return
        }
        if (val instanceof File) {
          form.append(key, val)
          return
        }
        console.log('Unrecognized object type for `'+key+'`, must be a File or FileList.')
      })

      request.send(form)
    }

    dfd.promise.abort = function() {
      aborted = true
      request.abort()
    }

    request.end((err, res) => {
      if (!aborted) {
        if (err) {
          return dfd.reject(err)
        }
        dfd.resolve(res.body)
      }
    })

    return dfd.promise
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