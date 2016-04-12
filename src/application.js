import React        from 'react'
import { render }   from 'react-dom'
import { merge, some }    from 'lodash'
import Store        from './store'

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
    this.store = null
    this.options.store.rootVar = this.options.page.rootVar
    this.internalStore = new Store(this.options.store)
    this.router = this.options.router
  }

  createStore(req) {
    if (this.router) {
      this.internalStore.addReducer('routing', this.router.getReducer())
    }
    const store = this.internalStore.finalize(req)
    if (this.router) {
      this.router.registerStore(store)
    }    
    return store
  }

  getComponent(store, req, renderProps, client = false) {
    let component = (this.router)
      ? this.router.getComponent(renderProps, client)
      : this.options.root

    if (!component) {
      throw new Error('Must initialize the application with a `router` or `root` property')
    }

    return this.internalStore.getWrappedComponent(store, component)
  }

  render() {
    const mountNode = document.getElementById(this.options.page.rootId)

    if (this.router) {
      return this.router.match((error, redirectLocation, renderProps)=> {
        const store = this.createStore()
        const component = this.getComponent(store, null, renderProps, true)
        render(component, mountNode)
      })
    }

    const store = this.createStore()
    const component = this.getComponent(store, null, null, true)
    render(component, mountNode)
  }

  resolve(req, renderProps) {
    const store = this.createStore(req)
    const component = this.getComponent(store, req, renderProps)
    return this.internalStore.fetchComponentData(renderProps.components, renderProps.params)
      .then(()=> {
        return {
          store,
          component,
          status: found(renderProps) ? 200 : 404
        }
      })
  }
}

function found(renderProps) {
  if (some(renderProps.routes, r => r.notFound)) {
    return false;
  }
  return true
}

