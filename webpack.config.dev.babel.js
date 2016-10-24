import { join } from 'path';
import { main } from './package.json';

export default {
  entry: {
    "videojs-vast-vpaid.umd": main
  },
  output: {
    path: join(__dirname, 'dist'),
    libraryTarget: 'umd',
    filename: '[name].js'
  },
  devtool: 'cheap-module-eval-source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',

        // Exclude all modules but the VPAID module dependencies
        exclude: /node_modules\/(?!vpaid).+/
      }
    ]
  }
}