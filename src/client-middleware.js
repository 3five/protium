export default function clientMiddleware(client) {
  return store => next => action => {
    const { dispatch, getState }              = store;
    const { promise, types, run, ...rest }    = action;
    const [REQUEST, SUCCESS, FAILURE]         = types;

    let result, error;

    // Syncronous Action
    if (types.length === 1) {
      try {
        result = run(client, dispatch, getState)
      } catch (e) {
        error = e
      }
      return next({ ...rest, result, error, type: REQUEST })
    }

    // Non conforming action, skip it
    if (types.length > 1 && !promise) {
      console.log("Non-conforming action, must specify a `promise` or `run` payload.", action)
      return next(action);
    }

    // Async actions, kick it off.
    next({...rest, type: REQUEST});

    // Setup handler action
    return Promise.resolve(promise(client, dispatch, getState))
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