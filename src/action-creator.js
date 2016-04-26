
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
        run: (...args)=> {
          let proto = Object.getPrototypeOf(cb)
          args.unshift(payload)
          try {
            return cb.apply(proto, args)
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
        promise: (...args)=> {
          let proto = Object.getPrototypeOf(cb)
          args.unshift(payload)
          try {
            return Promise.resolve(cb.apply(proto, args))
          } catch(e) {
            console.log(`ActionCreator Error:`, e)
            return Promise.reject(e)
          }
        }
      }
    }
  }

  identity() {
    return this.sync(payload => payload)
  }
}