import React     from 'react'
import thunk     from 'redux-thunk'
import promise   from 'redux-promise'
import { merge, reduce } from 'lodash'
import { Provider } from 'react-redux'
import persistState from 'redux-devtools/lib/persistState'
import clientMiddleware from './api-client'
import {
  compose,
  createStore,
  combineReducers,
  applyMiddleware
} from 'redux'

export default class Store {

  static defaults = {
    devTools: true,
    apiClient: {},
    reducers: {},
    middleware: [
      thunk,
      promise
    ],
    composers: [],
    createMiddleware: middleware => middleware,
    createComposers: comp => comp
  }

  constructor(opts) {
    this.options = merge({}, Store.defaults, opts)
    this.reducers = this.options.reducers
    this.middleware = this.options.middleware
    this.composers = this.options.composers
  }
  
  addReducer(name, reducer) {
    this.reducers[name] = reducer
  }

  removeReducer(name) {
    delete this.reducers[name]
  }

  getInitialState() {
    let state = {}
    if (SERVER) {
      return state
    }

    if (window[this.options.rootVar]) {
      state = window[this.options.rootVar]
    }

    // Handles react-router-redux #365; 
    // react-router/redux doesn't like routing state sent from server
    if (state.routing) {
      state.routing = {}
    }

    return state
  }

  finalize(req, router = null) {
    let client;
    const initialState = this.getInitialState()

    if (this.options.apiClient) {
      this.middleware.push(clientMiddleware(req, this.options.apiClient))
    }

    const middleware = this.options.createMiddleware(this.middleware, { req })
    const reducer = combineReducers({ ...this.reducers })
    
    this.composers.push(applyMiddleware(...middleware))

    if (CLIENT && this.options.devTools && window.devToolsExtension) {
      this.composers.push(
        window.devToolsExtension(),
        persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
      )
    }
    
    const composers = this.options.createComposers(this.composers)
    const finalCreateStore = compose(...composers)(createStore)
    return finalCreateStore(reducer, initialState)
  }

  getWrappedComponent(store, instance) {
    return <Provider store={store}>{instance}</Provider>
  }
  
  fetchComponentData(store, components, params) {
    const needs = reduce(components, (prev, current) => {
      let nested = []
      if (current.WrappedComponent && current.WrappedComponent.need !== current.need) {
        nested = current.WrappedComponent.need
      }
      return (current.need || [])
        .concat(nested)
        .concat(prev)
    }, [])
    return sequence(needs, need => store.dispatch(need(params, store.getState())))
  }
}

function sequence(items, consumer) {
  const results = []
  const runner = () => {
    const item = items.shift()
    if (item) {
      return consumer(item)
        .then((result) => {
          results.push(result)
        })
        .then(runner);
    }
    return Promise.resolve(results)
  }
  return runner();
}
