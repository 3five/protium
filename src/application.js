import React              from 'react'
import { render }         from 'react-dom'
import { some }           from 'lodash'
import { loadOnServer }   from 'redux-connect'
import { AppContainer }   from 'react-hot-loader'
import Store              from './store'
import extendify          from 'custom-extend'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

global.__PROTIUM__ = { store: null }

export default class Application {

  static defaults = {
    router: null,
    root: null,
    store: {},
    page: {
      doctype: '<!doctype html>',
      rootVar: '__STATE__',
      rootId: 'application'
    }
  };

  constructor(options = {}) {
    this.options = merge({}, Application.defaults, options)
    this.options.store.rootVar = this.options.page.rootVar
    this.router = this.options.router
    this.store = new Store(this.options.store)
    if (this.router) {
      this.history = this.router.createHistory()
    }
  }

  createStore(history, http) {
    let store = http ? null : __PROTIUM__.store

    if (history) {
      this.store.upgradeWithRouting(
        this.router.getReducers(), 
        this.router.getMiddleware(history)
      )
    }

    // Only hang onto the store globally if clientside
    if (!store) {
      store = this.store.finalize(http)
      if (!http) {
        __PROTIUM__.store = store
      }
    }
    
    if (history) {
      this.router.registerStore(history, store)
    }

    return store
  }

  getComponent(store, renderProps, http) {
    let component = (this.router)
      ? this.router.getComponent(renderProps, http)
      : this.options.root

    if (!component) {
      throw new Error('Must initialize the application with a `router` or `root` property')
    }

    let provider = this.store.getWrappedComponent(store, component)

    if (this.options.hot && __CLIENT__) {
      return <AppContainer store={store}>
        {provider}
      </AppContainer>
    }

    return provider
  }

  render() {
    const mountNode = document.getElementById(this.options.page.rootId)
    const http = null

    if (this.router) {
      const history = this.router.createHistory()
      const store = this.createStore(history, http)
      return this.router.match(history, store, http, (error, redirectLocation, renderProps)=> {
        const component = this.getComponent(store, renderProps)
        render(component, mountNode)
      })
    }

    const store = this.createStore()
    const component = this.getComponent(store)
    render(component, mountNode)
  }

  resolve(store, renderProps, http) {
    const component = this.getComponent(store, renderProps, http)
    return loadOnServer({store, ...renderProps})
      .then(()=> {
        return {
          store,
          component,
          status: getStatus(renderProps) || 200
        }
      })
  }

}

function getStatus(renderProps) {
  if (some(renderProps.routes, r => r.notFound)) {
    return 404
  }
  return null
}

