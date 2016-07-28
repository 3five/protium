import { createAction } from 'redux-actions'

const loadStart = createAction('@reduxAsyncConnect/BEGIN_GLOBAL_LOAD');
const loadEnd = createAction('@reduxAsyncConnect/END_GLOBAL_LOAD');

export default function asyncMiddleware({ dispatch }) {  

  const tracker = new Tracker(dispatch)

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

    return next(action);
  }
}

class Tracker {
  
  promises = []

  get loading() {
    return !!this.promises.length
  }

  constructor(dispatch) {
    this.dispatch = dispatch
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
    if (!this.loading) {
      setTimeout(x => {
        this.dispatch(loadEnd())
      }, 0)
    }
  }
}

function isPromise(x) {
  return x && x.then;
}
