const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devServer: {
    static: './',
    hot: true,
    liveReload: true,
  },
  performance: {
    hints: false
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader'
      }
    ],
  },
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three'), // Fixes "Multiple instances of Three.js being imported." warning.
    },
    extensions: [ '.ts', '.js', '.d.ts' ],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
