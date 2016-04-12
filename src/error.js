import React, {Component} from 'react'
import Helmet from 'react-helmet'

export default class ErrorComponent extends Component {
  render() {
    const { error, store, production } = this.props
    return <div>
      <Helmet title="Error" />
      <p className="label"><strong>ERROR</strong></p>
      <h1>{error.message}</h1>
      {!production && <div>
        <h3>Stack Trace</h3>
        <pre>{error.stack}</pre>
      </div>}
      {!production && store && <div>
        <h3>State</h3>
        <pre>{JSON.stringify(store.getState(), null, 2)}</pre>
      </div>}
    </div>
  }
  
  static inlineCss = `
    html, body { margin: 0; padding 0; }
    * { box-sizing: border-box; }
    body {
      background: #e8e8e8;
      color: #333;
      font-family: sans-serif;
      padding: 30px;
      margin: 0;
    }
    
    #application {
      max-width: 90%;
      padding: 30px;
      margin: 0 auto;
      background: #fff;
      border-radius: 4px;
    }
    .label {
      text-transform: uppercase;
      color: #999;
    }
    h1 {
      font-size: 25px;
      letter-spacing: -0.04em;
      border-bottom: 1px solid #d0d0d0;
      padding-bottom: 0.5em;
      margin-bottom: 1em;
    }
    pre {
      background: #e8e8e8;
      overflow:scroll;
      padding: 12px 15px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      line-height: 1.3;
    }
`
}