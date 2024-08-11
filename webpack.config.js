const path = require('path');

module.exports = {
    mode: "none",
    entry: {
        script: './src/script.ts'
    },
    output: {
        path: path.resolve(__dirname, 'public\\assets'),
        filename: 'js/[name].bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: "babel-loader",
                exclude: /node_modules/
            },
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js",],
        modules: ["node_modules"]
    }
};