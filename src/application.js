import React                    from 'react'
import ReactDom                 from 'react-dom'
import HtmlPage                 from './htmlpage'
import StatefulApp              from './statefulapp'
import thunk                    from 'redux-thunk'
import { merge }                from 'lodash'
import createBrowserHistory     from 'history/lib/createBrowserHistory'

import {
  compose,
  createStore,
  combineReducers,
  applyMiddleware
} from 'redux'

import {
  syncHistory,
  routeReducer
} from 'redux-simple-router'

const SERVER = !(global && global.document && global.document.body)

export default class ProtiumApplication {

  static defaults = {
    routes: [],
    reducers: {},
    middleware: [
      thunk
    ],
    page: {
      title: '',
      meta: {},
      links: [],
      scripts: [],
      state: {},
      component: null,
      doctype: '<!doctype html>',
      rootVar: '__STATE__',
      rootId: 'application'
    }
  };

  constructor(options = {}) {
    this.options = merge({}, ProtiumApplication.defaults, options)
  }

  createHistory() {
    return this.options.history
      ? this.options.history
      : createBrowserHistory()
  }

  createStore(history) {
    const initialState = this.getInitialState()
    const reducer = combineReducers({
      ...this.options.reducers,
      routing: routeReducer
    })

    const routerMiddleware = syncHistory(history)

    const middleware = [...this.options.middleware, routerMiddleware]

    const createStoreWithMiddleware = compose(
      applyMiddleware(...middleware)
    )(createStore)

    return createStoreWithMiddleware(reducer, initialState)
  }

  getInitialState() {
    if (SERVER || !global[this.options.page.rootVar]) {
      return {}
    }
    return global[this.options.page.rootVar]
  }

  render() {
    const history = this.createHistory()
    const store = this.createStore(history)
    const app = <StatefulApp
      history={history}
      store={store}
      routes={this.options.routes}
    />

    ReactDom.render(app, document.getElementById(this.options.page.rootId))
  }

}
