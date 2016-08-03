import React, {Component} from 'react'
import Helmet from 'react-helmet'
import PrettyError from 'pretty-error'
import AnsiToHTML from 'ansi-to-html'

const pe = new PrettyError()
const convert = new AnsiToHTML();
pe._renderer._config.terminalWidth = 9999

export default class ErrorComponent extends Component {
  render() {
    const { error, store, production } = this.props
    let pError = pe.render(error)

    // Ridiculous whitespace hack
    const errString = (convert.toHtml(pError))
      .replace(/<\/span>    <span style="color:#AAA">/gm, '')

    const errStyle = {
      color: '#fff',
      backgroundColor: '#000',
      whiteSpace: 'pre-line',
      overflow: 'scroll',
      fontFamily: 'monospace',
      padding: '15px'
    }

    return <div className="container">
      <Helmet title="Error" />
      <span className="label label-danger">
        <strong>ERROR</strong>
      </span>
      <h1>{error.message}</h1>
      {!production && <div>
        <h3>Stack Trace</h3>
        <div style={errStyle} 
             className="well" 
             dangerouslySetInnerHTML={{__html: errString}}></div>
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