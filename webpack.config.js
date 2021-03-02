const currentTest = process.env.npm_lifecycle_event
const path = require("path")
const {CleanWebpackPlugin} = require("clean-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const fse = require("fs-extra")
const HtmlWebpackPlugin = require("html-webpack-plugin")

const postcssPlugins = [
    require("postcss-import"),
    require("postcss-simple-vars"),
    require("postcss-nested"),
    require("postcss-mixins"),
    require("autoprefixer"),
]

const copyAllHTMLFiles = fse.readdirSync("./app").filter( pages => {
    return pages.endsWith(".html")
}).map( page => {
    return new HtmlWebpackPlugin({
        filename: page,
        template: './app/' + page
    })
})

const cssConfig = {
    test: /\.css$/i,
    use: ["css-loader", {
        loader: "postcss-loader",
        options: {
            postcssOptions : {
                plugins: postcssPlugins
            }
        }
    }]
}

const babelLoader = {
    test: /\.js$/,
    exclude: /(node_modules)/,
    use: {
        loader: "babel-loader",
        options: {
            presets: ["@babel/preset-env"]
        }
    }
}

class RunAfterCompilation {
    apply (compiler) {
        compiler.hooks.done.tap("copy images", () => fse.copySync(
            './app/assets/images', "./doc/assets/images"
        ))
    }
}

const config = {
    entry: "./app/assets/scripts/scripts.js",
    module: {
        rules : [
            cssConfig
        ]
    },
    plugins: copyAllHTMLFiles
}

if(currentTest == "dev") {
    cssConfig.use.unshift("style-loader")

    config.output = {
        filename: "bundeled.js",
        path: path.resolve(__dirname, "app")
    }

    config.devServer = {
        before: (app, server) => server._watch("./app/**/*.html"), 
        contentBase: path.join(__dirname, "app"),
        hot: true,
        port: 8080,
        host: "192.168.8.105",
    }

    config.mode = "development"
}

if(currentTest == "build") {
    
    cssConfig.use.unshift(MiniCssExtractPlugin.loader)

    postcssPlugins.push(require("cssnano"))

    config.output = {
        filename: "[name].[chunkhash].js",
        chunkFilename: "[name].[chunkhash].js",
        path: path.resolve(__dirname, "doc")
    }

    config.module.rules.push( babelLoader )

    config.mode = "production"

    config.optimization = {
        splitChunks: {
            chunks: "all"
        }
    }

    config.plugins.push( 
        new CleanWebpackPlugin(), 
        new MiniCssExtractPlugin({
            filename: "[name].[chunkhash].css",
            chunkFilename: "[name].[chunkhash].css"
        }),
        new RunAfterCompilation()
    )
}



module.exports = config