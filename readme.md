# Protium

Protium is a micro framework for building universal React/Redux apps.

Bundles `react`, `react-router`, and `redux` into a nice little package, takes care of routing and store/reducer setup for you (more examples forthcoming).

WIP, don't use this in production... yet!

Uses [react-helmet](https://github.com/nfl/react-helmet) for `<head>` management.

`import {Helmet} from 'protium'`, and include that component within any of your views.

## Example

```javascript
// app.js

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
  routes: [
    <Route path="/" component={Root}>
      <IndexRoute component={Comp} />
      <Route path="/a" component={Comp} />
      <Route path="/b" component={Comp} />
      <Route path="/c" component={Comp} />
      <Route path="*" component={NotFoundComp} notFound={true} /> // signals 404 on server
    </Route>
  ]
})

export default new Application({
  router,
  reducers
})
```

```javascript
// client.js (short and sweet!)
import app from './app'

app.render()
```

```javascript
// server.js
import express       from 'express'
import app           from './app'
import { renderer }  from 'protium/router'

const server = express()
export default server

server.use('/assets', express.static('dist'))
server.get('/*', renderer(app))
```

