import React        from 'react'
import { merge }    from 'lodash'
import {
  Router as ReactRouter,
  RouterContext,
  browserHistory,
  createMemoryHistory,
  match
} from 'react-router'

import {
  syncHistoryWithStore,
  routerReducer
} from 'react-router-redux'

import {
  ReduxAsyncConnect,
  reducer as reduxAsyncConnect
} from 'redux-async-connect'

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

export renderer from './renderer'

export default Router

export class Router {

  static defaults = {
    routes: []
  };

  constructor(opts) {
    this.options = merge({}, Router.defaults, opts)
    this.routes = this.options.routes
  }
  
  registerStore(history, store) {
    return syncHistoryWithStore(history, store)
  }

  getReducers() {
    return {
      routing: routerReducer,
      reduxAsyncConnect
    }
  }

  getComponent(renderProps, req) {
    return (!req)
      ? <ReactRouter render={Router.asyncRenderer} {...renderProps} />
      : <RouterContext {...renderProps} />
  }

  match(req, callback) {
    if (arguments.length === 1 && typeof req === 'function') {
      callback = req
      req = null
    }
    return match(this.createMatchOptions(req), callback)
  }

  createMatchOptions(req) {
    const opts = { routes: this.routes }
    if (req) {
      opts.history = createMemoryHistory()
      opts.location = req.url
    } else {
      opts.history = browserHistory
    }
    return opts
  }

  static asyncRenderer(props) {
    return <ReduxAsyncConnect {...props} filter={item => !item.deferred} />
  }

}