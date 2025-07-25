const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

const htmlFiles = fs.readdirSync('./src', { withFileTypes: true })
	.filter(item => !item.isDirectory())
	.filter(item => path.parse(item.name).ext === '.html')
	.map(htmlFile => path.parse(htmlFile.name).name);

// Only create entry points for HTML files that have corresponding TypeScript files
const pagesWithTS = htmlFiles.filter(page => fs.existsSync(`./src/${page}.ts`));

// All HTML files (for plugin generation)
const allPages = htmlFiles;

module.exports = {
	entry: pagesWithTS.reduce((config, page) => {
		config[page] = `./src/${page}.ts`;
		return config;
	}, {}),

    plugins: [].concat(allPages.map((page) => new HtmlWebpackPlugin({
          title: `${page}`,
          template: `./src/${page}.html`,
          filename: `${page}.html`,
          chunks: pagesWithTS.includes(page) ? [page] : [], // Only include chunks for pages with TS
    }), )),

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: [
            /node_modules/,
          ],
          options: {
            configFile: "tsconfig.esm.json"
          }
        },
        {
          test: /\.html$/i,
          use: 'html-loader'
        },
        {
          test: /\.css$/,
          type: 'asset/resource',
          generator: {
            filename: 'css/[name][ext]'
          }
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]'
          }
        },
        {
          test: /\.ico$/i,
          type: 'asset/resource',
          generator: {
            filename: '[name][ext]'
          }
        }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.svg', '.json'],
    },
    output: {
      filename: '[name].js',
      library: 'epicgames-frontend',
      libraryTarget: 'umd',
      path: process.env.WEBPACK_OUTPUT_PATH ? path.resolve(process.env.WEBPACK_OUTPUT_PATH) : path.resolve(__dirname, '../../../SignallingWebServer/www'),
      clean: true,
      globalObject: 'this',
      hashFunction: 'xxhash64',
    },
    experiments: {
      futureDefaults: true
    },
	devServer: {
    	static: {
    		directory: path.join(__dirname, '../../../SignallingWebServer/www'),
    	},
    },
}
