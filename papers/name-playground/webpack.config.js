const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  watch: true,
  entry: {
    app: path.resolve(__dirname, './src/index.jsx')
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: [ 'app' ],
      template: path.resolve(__dirname, './src/index.pug'),
      filename: 'index.html'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ],
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        options: {
          cacheDirectory: path.resolve(__dirname, './.cache'),
          presets: [ '@babel/preset-env', '@babel/preset-react' ]
        }
      }]
    }, {
      test: /\.pug$/,
      use: [{
        loader: 'pug-loader'
      }]
    }, {
      test: /\.s?css$/,
      use: [{
        loader: MiniCssExtractPlugin.loader
      }, {
        loader: 'css-loader',
        options: {
          modules: true,
          importLoaders: 2,
          localIdentName: '[path][name]__[local]--[hash:base64:5]',
          camelCase: 'dashesOnly',
          sourceMap: true
        }
      }, {
        loader: 'sass-loader',
        options: {
          sourceMap: true
        }
      }]
    }, {
      test: /\.(gif|png|jpe?g|svg)$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 8192,
          name: 'images/[name].[ext]'
        }
      }]
    }]
  },
  devtool: 'source-map'
}
