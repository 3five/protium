// import 'source-map-support/register'
import React                      from 'react'
import path                       from 'path'
import extendify                  from 'extendify'
import _require                   from 'webpack-external-require'
import { plugToRequest }          from 'react-cookie'
import HtmlPage                   from './htmlpage'
import ErrorComponent             from './error'
import Application                from './application'
import { 
  renderToString, 
  renderToStaticMarkup 
} from 'react-dom/server'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

const DOCTYPE = '<!doctype html>'

const production = process.env.NODE_ENV === 'production'

global.__SERVER__ = true
global.__CLIENT__ = false

export function renderer(appFn, options = {}) {

  return (req, res)=> {
    if (req.url === '/favicon.ico') {
      return res.sendStatus(404)
    }

    let app;

    try {
      if (typeof appFn === 'string') {
        let appPath = _require.resolve(appFn)
        if (!__PRODUCTION__) {
          delete _require.cache[appPath]
        }
        let _app = _require(appPath)
        app = _app.default ? _app.default : _app
      } 
      else if (typeof appFn === 'function') {
        app = appFn()
      } 
      else if (appFn instanceof Application) {
        app = appFn
      } 
      else {
        throw new Error('Unable to load application')
      }
    } catch(err) {
      const page = getErrorPage(null, null, err)
      return res.status(500).send(getHtml(null, page))
    }


    try {

    const http = {req, res}
    const unplug = plugToRequest(req, res)
    const history = app.router.createHistory()
    const store = app.createStore(history, http)

    return app.router.match(history, store, http, (error, redirect, renderProps) => {
      if (error) {
        const page = getErrorPage(null, app, error)
        return res.status(500).send(getHtml(app, page))
      }

      if (redirect) {
        return res.redirect(302, redirect.pathname + redirect.search)
      }

      if (!renderProps) {
        return res.status(404)
      }

      return app.resolve(store, renderProps, http)
        .then(({ store, component, status })=> {
          const page = getHtmlPage(store, app, component, options.page)
          res.status(status).send(getHtml(app, page))
        })
        .catch((err)=> {
          const page = getErrorPage(null, app, err)
          res.status(500).send(getHtml(app, page))
        })
        .catch((err)=> {
          const page = getErrorPage(null, null, err)
          res.status(500).send(getHtml(null, page))
        })
        .then(unplug)
    })

    } catch(err) {
      const page = getErrorPage(null, null, err)
      res.status(500).send(getHtml(null, page))
      try { unplug() } catch(e) {}
      return
    }

    // Should never fire
    res.sendStatus(500)
  }
}

function getHtml(app, page) {
  let dtype = DOCTYPE
  if (app) {
    dtype = app.options.page.doctype
  }
  return dtype + renderToString(page)
}

function getErrorPage(store, app, error, extraOpts) {
  let options = app ? merge({}, app.options.page, extraOpts) : extraOpts
  let ErrComp = ErrorComponent
  let inlineCss = ErrComp.inlineCss

  if (options.page) {
    options.page.main = false

    if (options.page.errorComponent) {
      ErrComp = options.page.errorComponent
    }

    if (!options.page.inlineCss) {
      options.page.inlineCss = ErrComp.inlineCss
    }
  }

  const comp = <ErrComp {...{store, app, error, production}} />
  const opts = !app ? {inlineCss} : null
  return getHtmlPage(store, app, comp, opts)
}

function getHtmlPage(store, app, component, extraOpts) {
  let options = app ? merge({}, app.options.page, extraOpts) : extraOpts
  let RootComp = HtmlPage
 
  options.component = component
 
  if (store) {
    options.state = store.getState()
  }

  if (app && app.options.page && app.options.page.rootComponent) {
    RootComp = app.options.page.rootComponent
  }

  return <RootComp {...options} />
}
