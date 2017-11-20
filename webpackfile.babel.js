import path from 'path';
import webpack from 'webpack';

export default {
  entry: {
    'videojs_4.vast.vpaid.js': path.join(__dirname, './src/scripts/videojs_4.vast.vpaid.js'),
    'videojs_4.vast.vpaid.min.js': path.join(__dirname, './src/scripts/videojs_4.vast.vpaid.js'),
    'videojs_5.vast.vpaid.js': path.join(__dirname, './src/scripts/videojs_5.vast.vpaid.js'),
    'videojs_5.vast.vpaid.min.js': path.join(__dirname, './src/scripts/videojs_5.vast.vpaid.js')
  },
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: '[name]'
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.swf$/,
        loader: 'file-loader?name=[name].[ext]'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, 'node_modules/vpaid-flash-client/js'),
          path.join(__dirname, 'src'),
          path.join(__dirname, 'test'),
          path.join(__dirname, 'node_modules/vpaid-html5-client/js')
        ],
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          {
            loader: 'css-loader',
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
          'resolve-url-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
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
