import { createAction } from 'redux-actions'

// const BEGIN_GLOBAL_LOAD = '@reduxAsyncConnect/BEGIN_GLOBAL_LOAD';
// const END_GLOBAL_LOAD = '@reduxAsyncConnect/END_GLOBAL_LOAD';

const loadStart = createAction('@protium/BEGIN_LOAD');
const loadEnd = createAction('@protium/END_LOAD');

let instances = 0;

export default function asyncMiddleware({ dispatch }) {

  function handler(type = 'then') {
    return result => {
      if (instances > 0) {
        instances--
        if (instances === 0) {
          dispatch(loadEnd())
        }
      }
      return type === 'then' ? result : Promise.reject(result)
    }
  }

  return next => action => {

    if (action.error) {
      console.error(`Error: ${action.type}\n`, action.payload)
    }

    if (!__CLIENT__) {
      return next(action);
    }

    if (action.promise) {
      instances++
      dispatch(loadStart())
      action.promise
        .then(handler('then'))
        .catch(handler('catch'))
    }

    return next(action);
  }
}

function isPromise(x) {
  return x && x.then;
}