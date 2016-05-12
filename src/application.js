import React              from 'react'
import { render }         from 'react-dom'
import { merge, some }    from 'lodash'
import { loadOnServer }   from 'redux-async-connect-3five'
import Store              from './store'

export default class Application {

  static defaults = {
    router: null,
    root: null,
    store: {},
    page: {
      doctype: '<!doctype html>',
      rootVar: '__STATE__',
      rootId: 'application'
    },
    component: {
      wrap(store, component) {
        return component
      }
    }
  };

  constructor(options = {}) {
    this.options = merge({}, Application.defaults, options)
    this.store = null
    this.options.store.rootVar = this.options.page.rootVar
    this.internalStore = new Store(this.options.store)
    this.router = this.options.router
  }

  createStore(renderProps, req) {
    if (this.router) {
      this.internalStore.upgradeReducers(this.router.getReducers())
    }
    if (!this.store) {
      this.store = this.internalStore.finalize(req)
    }
    if (this.router) {
      renderProps.router = this.router.registerStore(renderProps.router, this.store)
    }    
    return this.store
  }

  getComponent(store, renderProps, req) {
    let component = (this.router)
      ? this.router.getComponent(renderProps, req)
      : this.options.root

    if (!component) {
      throw new Error('Must initialize the application with a `router` or `root` property')
    }

    let provider = this.internalStore.getWrappedComponent(store, component)

    return this.options.component.wrap(store, provider, !!req)
  }

  render() {
    const mountNode = document.getElementById(this.options.page.rootId)

    if (this.router) {
      return this.router.match((error, redirectLocation, renderProps)=> {
        const store = this.createStore(renderProps, null)
        const component = this.getComponent(store, renderProps)
        render(component, mountNode)
      })
    }

    const store = this.createStore()
    const component = this.getComponent(store, null)
    render(component, mountNode)
  }

  resolve(renderProps, req) {
    const store = this.createStore(renderProps, req)
    const component = this.getComponent(store, renderProps, req)

    return loadOnServer({...renderProps, store})
      .then(()=> {
        return {
          store,
          component,
          status: found(renderProps) ? 200 : 404
        }
      })
  }

  setCredentials(user, pass) {
    if (this.options.store 
          && this.options.store.apiClient) {
      let server = this.options.store.apiClient.server 
            || (this.options.store.apiClient.server = {})
      server.auth = `${user}:${pass}`
    }
  }

}

function found(renderProps) {
  if (some(renderProps.routes, r => r.notFound)) {
    return false;
  }
  return true
}

