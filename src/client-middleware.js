import ApiClient from './client'

export default function clientMiddleware(req, options) {
  let client = new ApiClient(req, options)
  return store => next => action => {
    const { dispatch, getState }              = store
    const { promise, types, run, ...rest }    = action
    const [REQUEST, SUCCESS, FAILURE]         = types || []

    let result, error

    // Non conforming action, skip it
    if (!types || (types.length > 1 && !promise)) {
      return next(action)
    }

    // Syncronous Action
    if (types.length === 1) {
      try {
        result = run(client, dispatch, getState)
      } catch (e) {
        error = e
      }
      return next({ ...rest, result, error, type: REQUEST })
    }

    // Async actions, kick it off.
    next({...rest, type: REQUEST})

    // Setup handler action
    return promise(client, dispatch, getState)
      .then(onSuccess)
      .catch(onError)


    function onSuccess(result) {
      return next({...rest, result, type: SUCCESS})
    }

    function onError(error) {
      return next({...rest, error, type: FAILURE})
    }
  }
}