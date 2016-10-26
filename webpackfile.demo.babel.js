import path from 'path';
import webpack from 'webpack';

export default {
  entry:  path.join(__dirname, 'demo/scripts/demo.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: 'demo.js'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: [
          path.join(__dirname, 'demo')
        ],
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        loaders: [
          'style',
          {
            loader: 'css',
            query: {
              modules: false,
              importLoaders: 1,
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
    new webpack.optimize.OccurrenceOrderPlugin()
  ]
};
