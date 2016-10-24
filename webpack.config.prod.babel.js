import { join } from 'path';
import { main } from './package.json';
import webpack from 'webpack';

export default {
  entry: {
    "videojs-vast-vpaid.umd.min": main
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

        // Exclude all modules but the VPAID module dependencies
        exclude: /node_modules\/(?!vpaid).+/
      }
    ]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        // eslint-disable-next-line id-match
        screw_ie8: true,
        warnings: false
      }
    })
  ]

}