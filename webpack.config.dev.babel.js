import { join } from 'path';
import { main, name } from './package.json';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
  entry: main,
  output: {
    path: join(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: `${name}.umd.js`
  },
  devtool: 'cheap-module-eval-source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include:[
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
              query:  {
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
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin(`${name}.css`)
  ]
};
