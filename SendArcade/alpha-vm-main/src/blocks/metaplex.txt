/* eslint-disable max-len */
const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
// const {Buffer} = require('buffer');
const bs58 = require('bs58');
// const token = require('@solana/spl-token');
const web3 = require('@solana/web3.js');
const Solana = require('./solana');
const {createUmi} = require('@metaplex-foundation/umi-bundle-defaults');
const {generateSigner, keypairIdentity} = require('@metaplex-foundation/umi');
const {
    createFungible,
    mintV1,
    TokenStandard
} = require('@metaplex-foundation/mpl-token-metadata');
const {
    fromWeb3JsKeypair,
    fromWeb3JsPublicKey,
    toWeb3JsPublicKey
} = require('@metaplex-foundation/umi-web3js-adapters');
const {mplToolbox} = require('@metaplex-foundation/mpl-toolbox');
// eslint-disable-next-line max-len
const MtpxIconURI = 'data:image/png;base64,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';
// eslint-disable-next-line max-len
const MenuiconURI = `data:image/png;base64,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`;

class Metaplex {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'metaplex',
            name: 'Metaplex',
            color1: '#3a1aff',
            color2: '#3a1aff',
            menuIconURI: MenuiconURI,
            blocks: [
                {
                    opcode: 'deployToken',
                    blockType: BlockType.REPORTER,
                    text: '[METAPLEX] Deploy token with [name], [uri], [symbol], Decimals [decimals] and Initial supply [supply] by [privateKey]',
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Name'
                        },
                        uri: {
                            type: ArgumentType.STRING,
                            defaultValue: 'URI'
                        },
                        symbol: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Symbol'
                        },
                        decimals: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        supply: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        privateKey: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Private Key'
                        },
                        METAPLEX: {
                            type: ArgumentType.IMAGE,
                            dataURI: MtpxIconURI
                        }
                    }
                }

            ],
            menus: {
                networks: {
                    acceptReporters: true,
                    items: ['mainnet-beta', 'devnet', 'testnet']
                }
            }
        };
    }

    async deployToken (args) {
        const {name, uri, symbol, decimals, supply, privateKey} = args;
        const connection = new web3.Connection(Solana.net);
        const fromSecretKey = bs58.default.decode(privateKey);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        try {
            // Create UMI instance from agent
            const umi = createUmi(connection.rpcEndpoint).use(mplToolbox());
            umi.use(keypairIdentity(fromWeb3JsKeypair(fromKeypair)));
        
            // Create new token mint
            const mint = generateSigner(umi);
        
            let builder = createFungible(umi, {
                name,
                uri,
                symbol,
                sellerFeeBasisPoints: {
                    basisPoints: 0n,
                    identifier: '%',
                    decimals: 2
                },
                decimals,
                mint
            });
        
            if (supply) {
                builder = builder.add(
                    mintV1(umi, {
                        mint: mint.publicKey,
                        tokenStandard: TokenStandard.Fungible,
                        tokenOwner: fromWeb3JsPublicKey(fromKeypair.publicKey),
                        amount: supply * Math.pow(10, decimals)
                    })
                );
            }
        
            await builder.sendAndConfirm(umi, {confirm: {commitment: 'processed'}});
        
            return {
                mint: toWeb3JsPublicKey(mint.publicKey)
            };
        } catch (error) {
            throw new Error(`Token deployment failed: ${error.message}`);
        }
    }

}

module.exports = Metaplex;
