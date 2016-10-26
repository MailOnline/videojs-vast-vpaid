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
          path.join(__dirname, 'src'),
          path.join(__dirname, 'node_modules/vpaid-flash-client/js'),
          path.join(__dirname, 'node_modules/vpaid-html5-client/js')
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
    new webpack.optimize.OccurrenceOrderPlugin()
  ]
};
