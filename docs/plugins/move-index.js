var path = require('path')
var fs = require('fs')

var config;

exports.onHandleConfig = function(e) {
  config = e.data.config
}

exports.onHandleHTML = function(e) {
  if (e.data && e.data.fileName) {
    var rootIndex = path.resolve('.', 'index.html')
    var relPath = path.relative('.', config.destination)
    var inversePath = path.relative(config.destination, '.')
    var html = e.data.html;

    switch(e.data.fileName) {
      case 'index.html':
        html = html.replace('<base data-ice="baseUrl">', 
          '<base href="./' + relPath + '/" />'
        )

        fs.writeFileSync(rootIndex, html)
        break;
      default:
        e.data.html = html.replace('<a href="./">', 
          '<a href="' + inversePath + '/index.html">'
        )
        break;
    }
  }
}

exports.onComplete = function() {
  fs.unlinkSync(path.join(config.destination, 'index.html'))
}