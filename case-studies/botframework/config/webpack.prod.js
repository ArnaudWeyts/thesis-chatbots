const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: ['./src/index'],
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new webpack.NamedModulesPlugin(), new webpack.NoEmitOnErrorsPlugin()],
  output: {
    path: path.resolve('./build'),
    filename: 'server.js',
  },
};
