var webpack = require('webpack')
var path = require('path')
var fs = require('fs')
var nodeExternals = require('webpack-node-externals')

var config = {
  entry: {
    index: './src/index',
    router: './src/router',
    devtools: './src/devtools',
    server: './src/renderer',
    'fetch-client': ['./src/fetch-client']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        include: path.join(__dirname, '/src')
      }
    ]
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs'
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

module.exports = config