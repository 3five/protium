import { isFSA } from 'flux-standard-action'
import ApiClient from './client'

function isFunction(fn) {
  return typeof fn === 'function';
}

export default function clientMiddleware(options, http) {
  return store => next => action => {
    const { req, res } = http || {}
    const { dispatch, getState } = store
    const client = new ApiClient(options, store, http)

    if (isFunction(action)) {
      return action({ dispatch, getState, client });
    }

    if (isFSA(action) && isFunction(action.payload)) {
      return next({
        ...action,
        payload: action.payload({ dispatch, getState, client }),
      });
    }

    return next(action);
  }
}