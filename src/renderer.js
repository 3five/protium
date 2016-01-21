import React               from 'react'
import { renderToString }  from 'react-dom/server'
import { match, RoutingContext } from 'react-router'
import HtmlPage            from './htmlpage'

export default function ProtiumRenderer(app) {
  return (req, res)=> {
    const routes = app.options.routes
    const location = req.url

    match({ routes, location }, (error, redirect, state) => {
      let html

      if (error) {
        res.status(500).send(error.message)
      } else if (redirect) {
        res.redirect(302, redirect.pathname + redirect.search)
      } else if (state) {
        notFound(state) ? res.status(404) : res.status(200)
        html = app.options.page.doctype
        html += renderToString(getMasterComponent(app.options.page, state))
        res.send(html)
      } else {
        res.status(404).send('Not found')
      }
    })
  }
}

function getMasterComponent(pageOpts, state) {
  const Page = pageOpts.component ? pageOpts.component : HtmlPage
  const options = { ...pageOpts, component: <RoutingContext {...state} /> }
  return <Page {...options} />
}

function notFound(state) {
  return false;
}