import { isFSA } from 'flux-standard-action'

function isFunction(fn) {
  return typeof fn === 'function';
}

export default function contextThunkMiddleware(buildContext, options, http) {
  return store => next => action => {
    const { req, res } = http || {}
    const { dispatch, getState } = store
    
    let context = buildContext(store, options, http)

    if (!context) {
      context = {}
    }

    if (isFunction(action)) {
      return action({ dispatch, getState, ...context });
    }

    if (isFSA(action) && isFunction(action.payload)) {
      return next({
        ...action,
        payload: action.payload({ dispatch, getState, ...context }),
      });
    }

    return next(action);
  }
}