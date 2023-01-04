const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

module.exports = {
    core: {
        builder: 'webpack5',
    },
    stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
    ],
    framework: '@storybook/react',

    webpackFinal: async config => {
        config.resolve.plugins = [...(config.resolve.plugins || []), new TsconfigPathsPlugin()]

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

        return config
    },
}
