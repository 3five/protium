# Protium

Protium is a micro framework for building universal React/Redux apps.

Bundles `react`, `react-router`, and `redux` into a nice little package, takes care of routing and store/reducer setup for you (more examples forthcoming).

WIP, don't use this in production... yet!

Uses [react-helmet](https://github.com/nfl/react-helmet) for `<head>` management.

`import {Helmet} from 'protium'`, and include that component within any of your views.

## Example
**webpack.config.js**
```javascript
var DevTools = require('protium/devtools').default

var devtools = new DevTools(__dirname) // sets webpack context for your app

module.exports = [
  devtools.serverConfig('./app'), // points to exported application
  devtools.browserConfig('./client')  // points to client entrypoint
]
```


**app.js**
```javascript

import React from 'react'
import Root  from './views/root'
import Comp  from './views/comp'
import * as reducers from './reducers'
import { Application } from 'protium'
import {
  Router,
  Route,
  IndexRoute
} from 'protium/router'

const router = new Router({
  routes(store) { // use onEnter props to validate routes based on app state
    // Can also return a promise here, for async route definition
    return <Route path="/" component={Root}>
      <IndexRoute component={Comp} />
      <Route path="/a" component={Comp} />
      <Route path="/b" component={Comp} />
      <Route path="/c" component={Comp} />
      <Route path="*" component={NotFoundComp} notFound={true} /> // signals 404 on server
    </Route>
  }
})

export default new Application({
  router,
  store: {
    reducers
  }
})
```

**client.js**
```javascript
// client.js (short and sweet!)
import app from './app'

app.render()
```

```javascript
// server.js
import express       from 'express'
import app           from './app'
import { renderer }  from 'protium/server'

const server = express()
export default server

server.use('/assets', express.static('dist'))
server.get('/*', renderer(app))
```

