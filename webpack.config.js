module.exports = {
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'index.js',
    libraryTarget: 'commonjs'
  },
  module: {
    loaders: [
      { test: /\.js$/, include: __dirname + '/src', loader: 'babel' }
    ]
  },
  node: {
    path: false,
    qs: false
  },
  externals: {
    "history": true,
    "lodash": true,
    "react": true,
    "react-dom": true,
    "react-redux": true,
    "react-router": true,
    "redux": true,
    "redux-simple-router": true,
    "redux-thunk": true,
    "serialize-javascript": true,
    "history/lib/createBrowserHistory": true,
    "react-dom/server": true
  },
  devtool: 'source-map'
}