import React        from 'react'
import useScroll    from 'react-router-scroll/lib/useScroll'
import extendify    from 'custom-extend'

import { 
  syncHistoryWithStore, 
  routerReducer,
  routerMiddleware
} from 'react-router-redux'

import { 
  ReduxAsyncConnect, 
  reducer as reduxAsyncConnect 
} from 'redux-connect'

import {
  Router as ReactRouter,
  RouterContext,
  browserHistory,
  createMemoryHistory,
  match
} from 'react-router'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

export class Router {

  static defaults = {
    routes: []
  };

  constructor(opts) {
    this.options = merge({}, Router.defaults, opts)
    this.routes = null
  }

  getReducers() {
    return {
      routing: routerReducer,
      reduxAsyncConnect
    }
  }

  getMiddleware(history) {
    return routerMiddleware(history)
  }

  createHistory() {
    let history = __SERVER__ 
      ? createMemoryHistory()
      : useScroll(browserHistory)
    return history
  }

  getRoutes(store) {
    let routes = (typeof this.options.routes === 'function')
      ? this.options.routes(store)
      : this.options.routes
    return Promise.resolve(routes)
      .then(result => {
        return Array.isArray(result) ? result : [result]
      })
  }

  getComponent(renderProps, http) {
    return (!http)
      ? <ReactRouter render={Router.asyncRenderer} {...renderProps} />
      : <RouterContext {...renderProps} />
  }

  match(history, store, http, callback) {
    this.getRoutes(store).then(routes => {
      return match(this.createMatchOptions(routes, history, http), callback)
    })
  }

  createMatchOptions(routes, history, http) {
    const opts = { routes, history }
    if (http) {
      opts.location = http.req.url
    }
    return opts
  }

  registerStore(history, store) {
    return syncHistoryWithStore(history, store)
  }

  static asyncRenderer(props) {
    return <ReduxAsyncConnect {...props} filter={item => !item.deferred} />
  }

}

export default Router

export {
  push, 
  replace, 
  go, 
  goBack, 
  goForward
} from 'react-router-redux'

export {
  Route,
  IndexRoute,
  Redirect,
  IndexRedirect,
  Link,
  IndexLink,
} from 'react-router'

export {
  IndexLinkContainer,
  LinkContainer
} from 'react-router-bootstrap'

