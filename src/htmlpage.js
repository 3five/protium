import React, { Component }   from 'react'
import { renderToString }     from 'react-dom/server'
import { map }                from 'lodash'
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
    let htmlAttributes = head.htmlAttributes.toComponent()

    // Hack to avoid React createElement warning
    // https://github.com/nfl/react-helmet/issues/150
    htmlAttributes = (Array.isArray(htmlAttributes) && !htmlAttributes.length) 
      ? {} 
      : htmlAttributes

    return <html {...htmlAttributes}>
      <head>
        {head.title.toComponent()}
        {head.meta.toComponent()}
        {this.renderInlineCss()}
        {this.renderAsyncLinks()}
        {this.renderInlineScripts()}
        {head.link.toComponent()}
      </head>
      <body>
        {html}
        {this.renderState()}
        {this.renderMain()}
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

  renderMain() {
    if (!this.props.main) { return null }
    let scripts = Array.isArray(this.props.main)
          ? this.props.main
          : [this.props.main]
    return map(scripts, (script, i)=> {
      return this.renderScriptTag(script, i)
    })
  }

  renderScriptTag(src, key) {
    if (!src) return <noscript />
    return <script key={key} src={src} />
  }

  renderAsyncLinks() {
    if (!this.props.asyncLinks) { return null }
    let calls = map(this.props.links, k => `loadCSS("${k}")`).join(';')
    let html = LOADCSS_SCRIPT + calls
    return <script dangerouslySetInnerHTML={__(html)} />
  }

  renderInlineScripts() {
    if (!this.props.inlineScripts) { return null }
    let scripts = Array.isArray(this.props.inlineScripts) 
          ? this.props.inlineScripts 
          : [this.props.inlineScripts]
    return map(scripts, (script, i)=> {
      let html = __(script)
      return <script key={'inline-script-'+i} dangerouslySetInnerHTML={html} />
    })
  }

  renderInlineCss() {
    if (!this.props.inlineCss) { return null }
    let links = Array.isArray(this.props.inlineCss) 
          ? this.props.inlineCss 
          : [this.props.inlineCss]
    return map(links, (css, i)=> {
      let html = __(css)
      return <style key={'inline-css-'+i} dangerouslySetInnerHTML={html} />
    })
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