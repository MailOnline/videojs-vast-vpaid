import { join } from 'path';
import { main, name } from './package.json';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
  entry: main,
  output: {
    path: join(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: `${name}.umd.min.js`
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: [
          join(__dirname, 'src'),
          join(__dirname, 'node_modules/vpaid-flash-client/js'),
          join(__dirname, 'node_modules/vpaid-html5-client/js')
        ],
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        loaders: ExtractTextPlugin.extract({
          loader: [
            {
              loader: 'css',
              query: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[name]__[local]___[hash:base64:5]',
                minimize: true,
                autoprefixer: false,
                zindex: false,
                mergeIdents: false,
                reduceIdents: false,
                discardUnused: false
              }
            },
            {
              loader: 'autoprefixer-loader',
              query: {
                browsers: [
                  '> 1%',
                  'last 3 versions',
                  'iOS > 6',
                  'ie > 9'
                ],
                cascade: false
              }
            },
            'resolve-url',
            'sass'
          ]
        })
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        // eslint-disable-next-line id-match
        screw_ie8: false,
        warnings: false
      },
      mangle: {
        // eslint-disable-next-line id-match
        screw_ie8: false
      },
      output: {
        // eslint-disable-next-line id-match
        screw_ie8: false
      }
    }),
    new ExtractTextPlugin(`${name}.min.css`)
  ]

}