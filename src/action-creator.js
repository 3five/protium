
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
          return cb.apply(proto, args)
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
          return Promise.resolve(cb.apply(proto, args))
        }
      }
    }
  }

  identity() {
    return this.sync(payload => payload)
  }
}