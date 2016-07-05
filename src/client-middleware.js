import ApiClient from './client'

export default function clientMiddleware(options, http) {
  return store => next => action => {
    const { req, res } = http || {}
    const { dispatch, getState }              = store
    const { promise, types, run, ...rest }    = action
    const [REQUEST, SUCCESS, FAILURE]         = types || []

    const client = new ApiClient(options, store, http)

    let result, error

    // Non conforming action, skip it
    if (!types || (types.length > 1 && !promise)) {
      return next(action)
    }

    // Syncronous Action
    if (types.length === 1) {
      try {
        result = run({ client, dispatch, getState })
      } catch (e) {
        error = e
      }
      return next({ ...rest, result, error, type: REQUEST })
    }

    // Async actions, kick it off.
    next({...rest, type: REQUEST})

    // Setup handler action
    return promise({ client, dispatch, getState })
      .then(onSuccess)
      .catch(onError)


    function onSuccess(result) {
      return next({...rest, result, type: SUCCESS})
    }

    function onError(error) {
      console.error('ApiClient', error)
      return next({...rest, error, type: FAILURE})
    }
  }
}