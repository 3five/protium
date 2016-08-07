import Webpack          from 'webpack'
import Path             from 'path'
import AssetsPlugin     from 'webpack-assets-plugin'
import CleanPlugin      from 'clean-webpack-plugin'
import nodeExternals    from 'webpack-node-externals'
import devMiddleware    from 'webpack-dev-middleware'
import hotMiddleware    from 'webpack-hot-middleware'
import extendify        from 'extendify'

const merge = extendify({
  inPlace: false,
  isDeep: true,
  arrays: 'concat'
})

const __PRODUCTION__      = (process.env.NODE_ENV === 'production')
const __DEVELOPMENT__     = !(__PRODUCTION__)

export default class DevTools {

  static baseConfig = {
    environment: [],
    define: {},

    output: {
      filename: '[name].js',
      path: 'public',
      publicPath: '/assets/',
    },

    commonsChunk: {},
    vendorLibs: [
      'flux-standard-action',
      'isomorphic-fetch',
      'lodash',
      'protium',
      'qs',
      'react',
      'react-cookie',
      'react-dom',
      'react-helmet',
      'react-hot-loader/patch',
      'react-redux',
      'react-router',
      'react-router-bootstrap',
      'react-router-redux',
      'redux',
      'redux-actions',
      'redux-connect',
      'redux-promise',
      'use-scroll-behavior'
    ],

    module: {
      preLoaders: [
        {
          test: /\.jsx?$/,
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

    const opts = merge({}, DevTools.baseConfig, options)

    const entry = Array.isArray(entrypoint) ? entrypoint : [entrypoint]

    const config = {}

    config.context = this.cwd
    config.devtool = opts.devtool

    config.entry = { server: entry }

    config.output = opts.output
    config.output.path = Path.resolve(config.context, 'public')
    config.output.libraryTarget = 'commonjs'

    config.module = opts.module
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

    delete config.hot
    delete config.define

    return config
  }

  browserConfig(entrypoint, options = {}) {

    const opts = merge({}, DevTools.baseConfig, options)

    const entry = Array.isArray(entrypoint) ? entrypoint : [entrypoint]

    const config = {}

    config.context = this.cwd
    config.devtool = opts.devtool

    config.entry = { 
      client: entry,
      vendor: opts.vendorLibs
    }

    config.output = opts.output
    config.output.filename = '[name].js'
    config.output.library = '__APPLICATION__'
    config.output.libraryTarget = 'var'

    if (config.output.path === DevTools.baseConfig.output.path) {
      config.output.path = Path.resolve(config.context, 'public')
    }

    config.module = opts.module

    config.plugins = [
      new Webpack.optimize.CommonsChunkPlugin({
        name: 'vendor', 
        filename: 'vendor.js',
        async: false
      }),
      new AssetsPlugin({ 
        assetsRegex: /\.(jpe?g|png|gif|svg|scss|sass|css)$/i,
        metadata: true,
        prettyPrint: true,
        filename: 'assets.json'
      }),
      new Webpack.EnvironmentPlugin([
        'NODE_ENV',
        ...opts.environment
      ]),
      new Webpack.DefinePlugin({
        __CLIENT__: true,
        __SERVER__: false,
        __DEVELOPMENT__: __DEVELOPMENT__,
        __PRODUCTION__: __PRODUCTION__,
        ...opts.define
      }),
      ...opts.plugins || []
    ]

    if (__DEVELOPMENT__ && opts.hot) {
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

  devMiddleware(config, options = {}) {
    let browserConfig, serverConfig

    if (Array.isArray(config)) {
      browserConfig = config[0]
      serverConfig = config[1]
    } else {
      browserConfig = config.browser
      serverConfig = config.server
    }

    // SERVER SIDE //
    const serverCompiler = Webpack(serverConfig)
    serverCompiler.watch({}, (err, stats)=> {
      if (err) {
        throw err
      }
      if (stats.hasWarnings() || stats.hasErrors()) {
        console.log(stats.toString(statsOptions))
      } else {
        let s = stats.toJson()
        console.log(`(server) webpack built ${s.hash} in ${s.time}ms`)
      }
    })


    // CLIENT SIDE //
    const devCompiler = Webpack(browserConfig)
    const devDefaultOptions = {
      quiet: true,
      noInfo: true,
      hot: true,
      inline: true,
      lazy: false,
      publicPath: browserConfig.output.publicPath,
      headers: {'Access-Control-Allow-Origin': '*'},
      stats: {colors: true}
    }

    const devOptions = {...devDefaultOptions, ...(options.middleware || {})}

    const statsDefaults = {
      hash: false,
      version: false,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      colors: true
    }

    const statsOptions = {...statsDefaults, ...(options.stats || {})}

    return [
      devMiddleware(devCompiler, devOptions),
      hotMiddleware(devCompiler)
    ]
  }

}

