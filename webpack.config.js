const path = require('path');

module.exports = {
    mode: "production",
    entry: {
        script: "./src/script.ts",
        // icons: "./src/icons.js"
    },
    output: {
        path: path.resolve(__dirname, 'public/assets'),
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
            },
            {
                test: /\.css$/,
                use: ["style-loader", 
                    {
                        loader: "css-loader",
                        options: {
                            url: false
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        modules: ["node_modules", "src"]
    }
};
