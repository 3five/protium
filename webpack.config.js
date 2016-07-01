var webpack = require('webpack')
var fs = require('fs')
var nodeExternals = require('webpack-node-externals')

module.exports = {
  entry: {
    index: ['./src/index'],
    router: ['./src/router'],
    devtools: ['./src/devtools'],
    server: ['./src/renderer']
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
    nodeExternals()
  ],
  target: 'node',
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
    setImmediate: false
  },
  devtool: 'source-map'
}