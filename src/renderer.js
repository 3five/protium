import React                      from 'react'
import { plugToRequest }          from 'react-cookie'
import HtmlPage                   from './htmlpage'
import ErrorComponent             from './error'
import extendify                  from 'extendify'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

const production = process.env.NODE_ENV === 'production'

global.__SERVER__ = true
global.__CLIENT__ = false

export function renderer(appFn, options = {}) {
  return (req, res)=> {
    let app = (typeof appFn === 'function') ? appFn() : appFn

    if (req.url === '/favicon.ico') {
      return res.sendStatus(404)
    }

    if (!app.router) {
      throw new Error('Application must have a `router` for SSR.')
    }

    if (!app.options.page.errorComponent) {
      app.options.page.errorComponent = ErrorComponent
    }

    if (!app.options.page.rootComponent) {
      app.options.page.rootComponent = HtmlPage
    }

    const http = {req, res}
    const unplug = plugToRequest(req, res)
    const history = app.router.createHistory()
    const store = app.createStore(history, http)

    app.router.match(history, store, http, (error, redirect, renderProps) => {
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

      app.resolve(store, renderProps, http)
        .then(({ store, component, status })=> {
          const page = getHtmlPage(store, app, component, options.page)
          res.status(status).send(getHtml(app, page))
        })
        .catch((err)=> {
          const page = getErrorPage(null, app, err)
          res.status(500).send(getHtml(app, page))
        })
        .catch((error)=> {
          const component = <ErrorComponent {...{error, production}} />
          res.status(500).send(
            '<!doctype html>' + renderToStaticMarkup(component))
        })
        .then(unplug)
    })
  }
}

function getHtml(app, page) {
  return app.options.page.doctype + renderToString(page)
}

function getErrorPage(store, app, error) {
  const ErrComp = app.options.page.errorComponent
  if (ErrComp === ErrorComponent) {
    app.options.page.inlineCss = ErrorComponent.inlineCss
  }
  app.options.page.main = false
  const comp = <ErrComp {...{store, app, error}} />
  return getHtmlPage(store, app, comp)
}

function getHtmlPage(store, app, component, extraOpts) {
  let options = merge(app.options.page, extraOpts)
  if (store) {
    options.state = store.getState()
  }
  options.component = component
  const Page = options.rootComponent
  return <Page {...options} />
}
