import Webpack          from 'webpack'
import Path             from 'path'
import AssetsPlugin     from 'webpack-assets-plugin'
import CleanPlugin      from 'clean-webpack-plugin'
import merge            from 'deep-extend'
import nodeExternals    from 'webpack-node-externals'

const __PRODUCTION__      = (process.env.NODE_ENV === 'production')
const __DEVELOPMENT__     = !(__PRODUCTION__)

export default class DevTools {

  static baseConfig = {
    environment: {},
    define: {},

    output: {
      filename: '[name].js',
      publicPath: '/assets/'
    },

    module: {
      preLoaders: [
        {
          test: /\.js$/,
          loader: "source-map-loader"
        }
      ],
      loaders: [
        {
          test: /\.jsx?$/,
          loaders: ['babel'],
          exclude: /node_modules/
        }
      ]
    },

    devtool: 'source-map'
  }

  constructor(cwd) {
    this.cwd = Path.resolve(cwd)
  }

  serverConfig(entrypoint, options = {}) {
    const config = merge({}, DevTools.baseConfig, options)

    const entry = Array.isArray(entrypoint) ? entrypoint : [entrypoint]

    config.context = this.cwd

    config.entry = { server: entry }

    config.output.path = Path.resolve(config.context, 'public')
    config.output.libraryTarget = 'commonjs'

    config.externals = [nodeExternals()]

    config.target = 'node'
    config.node = {
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false,
      setImmediate: false
    }

    return config
  }

  browserConfig(entrypoint, options = {}) {
    const config = merge({}, DevTools.baseConfig, options)

    const entry = Array.isArray(entrypoint) ? entrypoint : [entrypoint]

    config.context = this.cwd

    config.entry = { client: entry }

    config.output.filename = '[name].js'
    config.output.path = Path.resolve(config.context, 'public')

    config.plugins = [
      new AssetsPlugin(),
      new Webpack.EnvironmentPlugin([
        'NODE_ENV',
        ...config.environment
      ]),
      new Webpack.DefinePlugin({
        __CLIENT__: true,
        __SERVER__: false,
        __DEVELOPMENT__: __DEVELOPMENT__,
        __PRODUCTION__: __PRODUCTION__,
        ...config.define
      }),
      new CleanPlugin([config.output.path])
    ]

    if (__DEVELOPMENT__ && options.hot) {
      config.entry.client.unshift(
        'webpack-hot-middleware/client',
        'webpack/hot/only-dev-server',
        'react-hot-loader/patch'
      )

      config.plugins.push(
        new Webpack.HotModuleReplacementPlugin(),
        new Webpack.IgnorePlugin(/webpack-stats\.json$/)
      )
    }

    return config
  }

}



