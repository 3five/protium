var fs = require('fs')
var nodeModules = fs.readdirSync('node_modules')
  .filter(function(x) { return x !== '.bin' })


module.exports = buildConfig()


function buildConfig() {
  return {
    entry: {
      index: ['./src/index.js'],
      router: ['./src/router.js']
    },
    output: {
      path: './',
      filename: '[name].js',
      libraryTarget: 'commonjs'
    },
    module: {
      loaders: [
        { test: /\.js$/, include: __dirname + '/src', loader: 'babel' }
      ]
    },
    externals: [
      nodeModules,
      /^[a-z\/\-0-9]+$/i
    ],
    devtool: 'source-map'
  }
}