# Protium

Protium is a micro framework for building universal React/Redux apps.

Bundles `react`, `react-router`, and `redux` into a nice little package, takes care of routing and store/reducer setup for you (more examples forthcoming).

WIP, don't use this in production... yet!

## Example

```
// app.js
import React from 'react'
import Root  from './views/root'
import Comp  from './views/comp'
import { 
  Application,
  Route, 
  IndexRoute 
} from 'protium'

export default new Application({
  routes: [
    <Route path="/" component={Root}>
      <IndexRoute component={Comp} title="Home" />
      <Route path="/a" component={Comp} title="Page A" />
      <Route path="/b" component={Comp} title="Page B" />
      <Route path="/c" component={Comp} title="Page C" />
    </Route>
  ],
  page: {
    scripts: ['/assets/client.js']
  }
})
```

```
// client.js (short and sweet!)
import app from './app'

app.render()
```

```
// server.js
import express       from 'express'
import app           from './app'
import { renderer }  from 'protium'

const server = express()
export default server

server.use('/assets', express.static('dist'))
server.get('/*', renderer(app))
```

