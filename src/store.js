import React                from 'react'
import { reduce }           from 'lodash'
import { Provider }         from 'react-redux'
import persistState         from 'redux-devtools/lib/persistState'
import promiseMiddleware    from 'redux-promise'
import extendify            from 'custom-extend'
import thunkMiddleware      from './context-thunk'
import asyncMiddleware      from './async-tracker'
import {
  compose,
  createStore,
  combineReducers,
  applyMiddleware
} from 'redux'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

export default class Store {

  static defaults = {
    devTools: true,
    apiClient: {},
    reducers: {},
    middleware: [],
    composers: [],
    buildContext: (store, options, http)=> ({}),
    createMiddleware: middleware => middleware,
    createComposers: comp => comp
  }

  constructor(opts) {
    this.options = merge(Store.defaults, opts)
    this.reducers = this.options.reducers
    this.middleware = this.options.middleware
    this.composers = this.options.composers
  }
  
  addReducer(name, reducer) {
    this.reducers[name] = reducer
  }

  upgradeWithRouting(reducers, routingMiddleware) {
    this.routing = true
    this.reducers = { ...this.reducers, ...reducers }
    this.routingMiddleware = routingMiddleware
  }

  removeReducer(name) {
    delete this.reducers[name]
  }

  getInitialState() {
    let state = {}
    if (__SERVER__) {
      return state
    }

    if (global[this.options.rootVar]) {
      state = global[this.options.rootVar]
    }

    return state
  }

  getWrappedComponent(store, instance) {
    return <Provider store={store} key="provider">{instance}</Provider>
  }

  finalize(http) {
    const initialState = this.getInitialState()
    let middleware = [ ...this.options.middleware ]

    // if (this.routing) {
    //   middleware.push(this.routingMiddleware)
    // }

    middleware.push(thunkMiddleware(this.options.buildContext, this.options, http))
    
    if (__CLIENT__) {
      middleware.push(asyncMiddleware)
    }

    middleware.push(promiseMiddleware)

    middleware = this.options.createMiddleware(middleware, http)
    
    const reducer = combineReducers({ ...this.reducers })
    
    this.composers.push(applyMiddleware(...middleware))

    if (__CLIENT__ && this.options.devTools && global.devToolsExtension) {
      this.composers.push(
        global.devToolsExtension(),
        persistState(global.location.href.match(/[?&]debug_session=([^&]+)\b/))
      )
    }
    
    const composers = this.options.createComposers(this.composers)
    const finalCreateStore = compose(...composers)(createStore)
    const finalStore = finalCreateStore(reducer, initialState)

    if (this.options.auth && typeof this.options.auth.initialize === 'function') {
      this.options.auth.initialize(finalStore, http)
    }

    return finalStore
  }

}
