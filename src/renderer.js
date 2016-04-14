import React                      from 'react'
import { merge }                  from 'lodash'
import { renderToString }         from 'react-dom/server'
import HtmlPage                   from './htmlpage'
import ErrorComponent             from './error'

const production = process.env.NODE_ENV === 'production'

export default function renderer(app) {

  if (!app.router) {
    throw new Error('Application must have a `router` for SSR.')
  }

  if (!app.options.page.errorComponent) {
    app.options.page.errorComponent = ErrorComponent
  }

  if (!app.options.page.rootComponent) {
    app.options.page.rootComponent = HtmlPage
  }

  return (req, res)=> {
    app.router.match(req, (error, redirect, renderProps) => {
      if (error) {
        const page = getErrorPage(null, app, error)
        return res.status(500).send(getHtml(app, page))
      }

      if (redirect) {
        return res.redirect(302, redirect.pathname + redirect.search)
      }

      if (!renderProps) {
        console.log('To configure a custom 404, register a route inside your root route')
        console.log('<Route path="*" component={NotFound} notFound={true} />')
        console.log('`notFound={true}` tells the renderer to send a 404')
        return res.status(404)
      }

      app.resolve(req, renderProps)
        .then(({ store, component, status })=> {
          const page = getHtmlPage(store, app, component)
          res.status(status).send(getHtml(app, page))
        })
        .catch((err)=> {
          const page = getErrorPage(null, app, err)
          res.status(500).send(getHtml(app, page))
        })
        .catch((err)=> {
          res.status(500).send(err.stack)
        })
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
  const comp = <ErrComp {...{store, app, error}} />
  return getHtmlPage(store, app, comp)
}

function getHtmlPage(store, app, component) {
  let options = merge({}, app.options.page)
  if (store) {
    options.state = store.getState()
  }
  options.component = component
  const Page = options.rootComponent
  return <Page {...options} />
}
