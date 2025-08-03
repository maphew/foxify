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
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'resources/scss')],
              },
              // Prepend variables import to all SCSS files
              additionalData: `@use 'variables' as *;`,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
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
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    },
    proxy: {
      // Only proxy API routes, not webpack dev server routes
      '/api/**': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // Proxy all other routes except webpack dev server routes
      context: (pathname) => {
        // Don't proxy webpack dev server routes
        if (pathname.startsWith('/ws') || 
            pathname.startsWith('/__webpack_dev_server__') ||
            pathname.startsWith('/webpack-dev-server') ||
            pathname.startsWith('/assets/')) {
          return false;
        }
        // Proxy everything else to backend
        return true;
      },
      target: 'http://localhost:3000',
      changeOrigin: true
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