
export default function action(...args) {
  let types = args.length === 1 && Array.isArray(args[0])
                ? args[0]
                : args;
  return new ActionCreator(types)
}


class ActionCreator {
  constructor(types) {
    this.types = types;
  }

  sync(cb) {
    return payload => {
      return {
        types: this.types,
        run: (opts)=> {
          let proto = Object.getPrototypeOf(cb)
          opts.payload = payload
          try {
            return cb.call(proto, opts)
          } catch(e) {
            console.log(`ActionCreator Error:`, e)
            return Promise.reject(e)
          }
        }
      }
    }
  }

  async(cb) {
    return payload => {
      return {
        types: this.types,
        promise: (opts)=> {
          let proto = Object.getPrototypeOf(cb)
          opts.payload = payload
          try {
            return Promise.resolve(cb.call(proto, opts))
          } catch(e) {
            console.log(`ActionCreator Error:`, e)
            return Promise.reject(e)
          }
        }
      }
    }
  }

  identity() {
    return this.sync(x => x.payload)
  }
}