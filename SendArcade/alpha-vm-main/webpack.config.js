/* eslint-disable max-len */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const webpack = require('webpack');

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devServer: {
        contentBase: false,
        host: '0.0.0.0',
        port: process.env.PORT || 8073
    },
    devtool: 'cheap-module-source-map',
    output: {
        library: 'VirtualMachine',
        filename: '[name].js'
    },
    // Use alias to polyfill node built-ins in webpack 4
    resolve: {
        // Added '.cjs' to ensure these files are resolved
        extensions: ['.js', '.mjs', '.cjs'],
        alias: {
            'buffer': require.resolve('buffer'),
            'events': require.resolve('events/'),
            'node:url': require.resolve('url')
        }
    },
    module: {
        rules: [
            // Force webpack to treat .mjs files in rpc-websockets as "javascript/auto"
            {
                test: /\.mjs$/,
                include: /node_modules\/rpc-websockets/,
                type: 'javascript/auto'
            },
            // Force webpack to treat .mjs files in @solana modules as "javascript/auto"
            {
                test: /\.mjs$/,
                include: /node_modules\/@solana/,
                type: 'javascript/auto'
            },
            // Add specific rule for ESM modules in wallet adapter
            {
                test: /\.js$/,
                include: /node_modules\/@solana\/wallet-adapter/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-proposal-optional-chaining',
                            '@babel/plugin-proposal-nullish-coalescing-operator'
                        ]
                    }
                }
            },
            // Transpile our source files and selected node_modules (including .js, .mjs, and .cjs files)
            {
                // This rule matches .js, .mjs, and .cjs files.
                // We exclude all node_modules except for our whitelisted packages.
                // The whitelist now includes:
                //   - @solana/web3.js, @solana/codecs, @solana/codecs-data-structures,
                //     @solana/spl-token, @solana/spl-token-metadata, @solana/errors, @solana/options,
                //     @solana/codecs-numbers, @solana/spl-token-group, @solana/codecs-strings, @solana/codecs-core,
                //     @solana/wallet-adapter-base, @solana/wallet-adapter-phantom, @solana/wallet-adapter-wallets,
                // It also whitelists @noble/curves, superstruct, and rpc-websockets.
                test: /\.(mjs|cjs|js)$/,
                exclude: /node_modules\/(?!((@solana\/(web3\.js|codecs|codecs-data-structures|spl-token|spl-token-metadata|errors|options|codecs-numbers|spl-token-group|codecs-strings|codecs-core|wallet-adapter-base|wallet-adapter-phantom|wallet-adapter-wallets))|(@noble\/curves)|superstruct|rpc-websockets)\/)/,
                loader: 'babel-loader',
                options: {
                    sourceType: 'unambiguous',
                    presets: [
                        ['@babel/preset-env', {modules: 'commonjs'}]
                    ],
                    plugins: [
                        '@babel/plugin-proposal-logical-assignment-operators',
                        '@babel/plugin-proposal-nullish-coalescing-operator',
                        '@babel/plugin-proposal-optional-chaining',
                        '@babel/plugin-proposal-class-properties',
                        'babel-plugin-add-module-exports'
                    ]
                }
            },
            {
                test: /\.mp3$/,
                loader: 'file-loader',
                options: {
                    outputPath: 'media/music/'
                }
            }
        ]
    },
    plugins: [
        // Provide Buffer and process polyfills if needed
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        })
    ]
};

module.exports = [
    // Web-compatible build
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'alpha-vm': './src/index.js',
            'alpha-vm.min': './src/index.js'
        },
        output: {
            libraryTarget: 'umd',
            path: path.resolve('dist', 'web')
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader?VirtualMachine'
                }
            ])
        }
    }),
    // Node-compatible build
    defaultsDeep({}, base, {
        target: 'node',
        entry: {
            'alpha-vm': './src/index.js'
        },
        output: {
            libraryTarget: 'commonjs2',
            path: path.resolve('dist', 'node')
        },
        externals: {
            'decode-html': true,
            'format-message': true,
            'htmlparser2': true,
            'immutable': true,
            'scratch-parser': true,
            'socket.io-client': true,
            'text-encoding': true
        }
    }),
    // Playground build
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'benchmark': './src/playground/benchmark',
            'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug'
        },
        output: {
            path: path.resolve(__dirname, 'playground'),
            filename: '[name].js'
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: require.resolve('./src/index.js'),
                    loader: 'expose-loader?VirtualMachine'
                },
                {
                    test: require.resolve('./src/extensions/scratch3_video_sensing/debug.js'),
                    loader: 'expose-loader?Scratch3VideoSensingDebug'
                },
                {
                    test: require.resolve('stats.js/build/stats.min.js'),
                    loader: 'script-loader'
                },
                {
                    test: require.resolve('scratch-blocks/dist/vertical.js'),
                    loader: 'expose-loader?Blockly'
                },
                {
                    test: require.resolve('scratch-audio/src/index.js'),
                    loader: 'expose-loader?AudioEngine'
                },
                {
                    test: require.resolve('scratch-storage/src/index.js'),
                    loader: 'expose-loader?ScratchStorage'
                },
                {
                    test: require.resolve('scratch-render/src/index.js'),
                    loader: 'expose-loader?ScratchRender'
                }
            ])
        },
        performance: {
            hints: false
        },
        plugins: base.plugins.concat([
            new CopyWebpackPlugin([{
                from: 'node_modules/scratch-blocks/media',
                to: 'media'
            }, {
                from: 'node_modules/scratch-storage/dist/web'
            }, {
                from: 'node_modules/scratch-render/dist/web'
            }, {
                from: 'node_modules/@turbowarp/scratch-svg-renderer/dist/web'
            }, {
                from: 'src/playground'
            }])
        ])
    })
];
