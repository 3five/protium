import React, { Component }   from 'react'
import { renderToString }     from 'react-dom/server'
import { map, merge }         from 'lodash'
import serialize              from 'serialize-javascript'
import Helmet                 from 'react-helmet'

export default class HtmlPage extends Component {

  static defaultProps = {
    state: {},
    doctype: '<!doctype html>',
    component: <div/>,
    rootVar: '__STATE__',
    rootId: 'application'
  };

  render() {
    const html = this.renderAppHtml()
    const head = this.getHead()
    const inlineCss = this.renderInlineCss()
    return <html {...head.htmlAttributes.toComponent()}>
      <head>
        {head.title.toComponent()}
        {head.meta.toComponent()}
        {inlineCss}
        {head.link.toComponent()}
      </head>
      <body>
        {html}
        {this.renderState()}
        {this.props.main && this.renderScriptTag(this.props.main)}
        {head.script.toComponent()}
      </body>
    </html>
  }

  getHead() {
    return Helmet.rewind()
  }

  asyncCss() {
    return this.props.inlineCss && this.props.inlineCss.length
  }

  renderScriptTag(src) {
    return <script src={src} />
  }

  renderAsyncLinks() {
    let calls = map(this.props.links, k => `loadCSS("${k}")`).join(';')
    let html = LOADCSS_SCRIPT + calls
    return <script dangerouslySetInnerHTML={__(html)} />
  }

  renderInlineCss() {
    let html = __(this.props.inlineCss)
    return <style dangerouslySetInnerHTML={html} />
  }

  renderAppHtml() {
    const html = renderToString(this.props.component)
    return <div id={this.props.rootId} dangerouslySetInnerHTML={__(html)} />
  }

  renderState() {
    let html = `${this.props.rootVar}=${serialize(this.props.state)}`
    return <script dangerouslySetInnerHTML={__(html)} />
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