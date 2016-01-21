import React, { Component }   from 'react'
import { renderToString }     from 'react-dom/server'
import { map, merge }         from 'lodash'
import serialize              from 'serialize-javascript'

export default class HtmlPage extends Component {

  static defaultProps = {
    title: '',
    meta: {},
    links: [],
    scripts: [],
    state: {},
    component: <div/>,
    rootVar: '__STATE__',
    rootId: 'application'
  };

  render() {
    return <html>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {this.asyncCss() && this.renderInlineCss()}
        {this.renderLinks()}
        {this.renderMetaInfo()}
        {this.renderTitle()}
      </head>
      <body>
        {this.renderAppHtml()}
        {this.renderState()}
        {this.renderScripts()}
      </body>
    </html>
  }

  static renderHtml(props) {
    const {doctype} = merge({}, HtmlPage.defaultProps, props)
    return doctype + renderToString(<HtmlPage {...props} />);
  }

  asyncCss() {
    return this.props.inlineCss && this.props.inlineCss.length
  }

  renderAsyncLinks() {
    let calls = map(this.props.links, k => `loadCSS("${k}")`).join(';')
    let html = LOADCSS_SCRIPT + calls
    return <script dangerouslySetInnerHTML={__(html)} />
  }

  renderInlineCss() {
    let html = __(this.props.inlineCss)
    return <style dangerouslySetInnerHTML={__(html)} />
  }

  renderLinks() {
    if (this.asyncCss()) {
      return this.renderAsyncLinks()
    }

    let count = 0
    return map(this.props.links, (href)=> {
      count++
      return <link key={`link-${count}`} rel="stylesheet" href={href} />
    })
  }

  renderMetaInfo() {
    let count = 0
    return map(this.props.meta, (content, name)=> {
      count++
      const props = { content, name }
      return <meta key={`meta-${count}`} {...props} />
    })
  }

  renderTitle() {
    return <title>{this.props.title}</title>
  }

  renderAppHtml() {
    const html = renderToString(this.props.component)
    return <div id={this.props.rootId} dangerouslySetInnerHTML={__(html)} />
  }

  renderState() {
    let html = `${this.props.rootVar}=${serialize(this.props.state)}`
    return <script dangerouslySetInnerHTML={__(html)} />
  }

  renderScripts() {
    let count = 0
    return map(this.props.scripts, (src)=> {
      count++
      return <script defer key={`script-${count}`} src={src}></script>
    })
  }

}

const LOADCSS_SCRIPT = `
(function(c){c.loadCSS=function(h,e,k){function f(a){for(var d=b.href,c=g.length;c--;)
if(g[c].href===d)return a();setTimeout(function(){f(a)})}var d=c.document,
b=d.createElement("link"),a;e?a=e:(a=(d.body||d.getElementsByTagName("head")[0]).childNodes,
a=a[a.length-1]);var g=d.styleSheets;b.rel="stylesheet";b.href=h;b.media="only x";
a.parentNode.insertBefore(b,e?a:a.nextSibling);b.c=f;f(function(){b.media=k||"all"});
return b};"undefined"!==typeof module&&(module.b=c.loadCSS)})(this);
`.replace(/\n/g, '')

function __(html) {
  return { __html: html }
}