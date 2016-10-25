import { join } from 'path';
import { main, name } from './package.json';
import webpack from 'webpack';

export default {
  entry: {
    [name]: main,
    [name + '.min']: main
  },
  output: {
    path: join(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: '[name].js'
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
        loaders: [
          {
            loader: 'css',
            query: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]__[local]___[hash:base64:5]',
              minimize: false
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
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js/,
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
    })
  ]
};
