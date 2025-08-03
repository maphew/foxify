const path = require('path');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

const commonConfig = {
  entry: './resources/js/app.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'public/assets/js'),
    clean: true,
    assetModuleFilename: '../[path][name][ext]',
    publicPath: '/assets/'
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: '../images/[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: '../fonts/[name][ext]',
        },
      },
      {
        test: /\.ejs$/i,
        use: ['html-loader', 'template-ejs-loader']
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '../css/[name].css',
      chunkFilename: '../css/[id].css',
    })
  ],
  optimization: {
    // was: minimize: isProduction,
    minimize: true, // Will be controlled by mode in merge
    minimizer: [
      '...', // Extend default minimizers (like Terser for JS)
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
  },
};

const developmentConfig = {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/assets/'
    },
    compress: true,
    port: 3002,
    hot: true,
    proxy: {
      context: () => true, // Proxy all requests
      target: 'http://localhost:3000',
      ws: true
    },
    devMiddleware: {
      writeToDisk: true, // Write files to disk so Express can serve them
    },
  },
};

const productionConfig = {
  mode: 'production',
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  return merge(commonConfig, isProduction ? productionConfig : developmentConfig);
};