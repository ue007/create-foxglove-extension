module.exports = {
    webpack(config) {
        const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

        config.module.rules.push({
            test: /\.s[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                'style-loader',
                // Translates CSS into CommonJS
                'css-loader',
                // Compiles Sass to CSS
                'sass-loader',
            ],
        })

        config.resolve = {
            ...config.resolve,
            plugins: [new TsConfigPathsPlugin()],
        }

        return config
    },
}
