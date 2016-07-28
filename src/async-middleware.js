import { createAction } from 'redux-actions'

// const BEGIN_GLOBAL_LOAD = '@reduxAsyncConnect/BEGIN_GLOBAL_LOAD';
// const END_GLOBAL_LOAD = '@reduxAsyncConnect/END_GLOBAL_LOAD';

const loadStart = createAction('@protium/BEGIN_LOAD');
const loadEnd = createAction('@protium/END_LOAD');

export default function asyncMiddleware({ dispatch }) {
  const tracker = new Tracker()

  return next => action => {

    if (action.error) {
      console.error(`Error: ${action.type}\n`, action.payload)
    }

    if (!__CLIENT__) {
      return next(action);
    }

    if (isPromise(action.payload)) {
      dispatch(loadStart())
      tracker.enqueue(action.payload)
    }

    process.nextTick(x => {
      if (!tracker.loading) {
        dispatch(loadEnd())
      }
    })

    return next(action);
  }
}

class Tracker {
  
  promises = []
  
  get loading() {
    return !!this.promises.length
  }
  
  enqueue(promise) {
    this.promises.push(promise)
    promise.then(x => {
      this.dequeue(promise)
      return x
    })
    .catch(err => {
      this.dequeue(promise)
      return Promise.reject(err)
    })
  }
  
  dequeue(promise) {
    let index = this.promises.indexOf(promise)
    this.promises.splice(index, 1)
  }
}

function isPromise(x) {
  return x && x.then;
}
