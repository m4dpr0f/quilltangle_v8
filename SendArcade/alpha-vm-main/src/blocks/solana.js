/* eslint-disable camelcase */
const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
const web3 = require('@solana/web3.js');
const bs58 = require('bs58');
const token = require('@solana/spl-token');
// const JUP_API = 'https://quote-api.jup.ag/v6';

// Import the correct wallet adapter packages
const {PhantomWalletAdapter} = require('@solana/wallet-adapter-phantom');
const {BackpackWalletAdapter} = require('@solana/wallet-adapter-backpack');
const {SolflareWalletAdapter} = require('@solana/wallet-adapter-solflare');
const {SlopeWalletAdapter} = require('@solana/wallet-adapter-slope');
const {GlowWalletAdapter} = require('@solana/wallet-adapter-glow');
const {BraveWalletAdapter} = require('@solana/wallet-adapter-brave');

// https://www.fffuel.co/eeencode/
// https://www.site24x7.com/tools/image-to-datauri.html
/* eslint-disable-next-line max-len */
const blockIconURI = `data:image/svg+xml,%3Csvg width='101' height='88' viewBox='0 0 101 88' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z' fill='%23FFFFFF'/%3E%3C/svg%3E`;
const MenuiconURI = `data:image/svg+xml;base64,${btoa('<svg width="101" height="100" viewBox="0 0 101 88" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z" fill="url(#paint0_linear_174_4403)"/><defs><linearGradient id="paint0_linear_174_4403" x1="8.52558" y1="90.0973" x2="88.9933" y2="-3.01622" gradientUnits="userSpaceOnUse"><stop offset="0.08" stop-color="#9945FF"/><stop offset="0.3" stop-color="#8752F3"/><stop offset="0.5" stop-color="#5497D5"/><stop offset="0.6" stop-color="#43B4CA"/><stop offset="0.72" stop-color="#28E0B9"/><stop offset="0.97" stop-color="#19FB9B"/></linearGradient></defs></svg>')}`;

class Solana {
    static net = 'https://flying-torrie-fast-mainnet.helius-rpc.com';
    static wallet = null;
    
    // ADDED: Map to resolve parent iframe requests
    static pendingRequests = {};

    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        // Initialize wallet if not already done
        if (!Solana.wallet) {
            const walletAdapters = [
                {name: 'Phantom', adapter: PhantomWalletAdapter},
                {name: 'Backpack', adapter: BackpackWalletAdapter},
                {name: 'Solflare', adapter: SolflareWalletAdapter},
                {name: 'Slope', adapter: SlopeWalletAdapter},
                {name: 'Glow', adapter: GlowWalletAdapter},
                {name: 'Brave', adapter: BraveWalletAdapter}
            ];

            for (const wallet of walletAdapters) {
                try {
                    Solana.wallet = new wallet.adapter();
                    console.log(`Successfully connected to ${wallet.name} wallet`);
                    break;
                } catch (error) {
                    console.log(`${wallet.name} wallet not found, trying next...`);
                }
            }

            if (!Solana.wallet) {
                console.error('No supported wallet found. Please install one of the supported wallets.');
            }
        }

        /* ADDED: listen for messages from parent window so we can resolve
           promises created in requestParent() */
        this.handleParentResponse = this.handleParentResponse.bind(this);
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('message', this.handleParentResponse);
        }
    }

    /* ADDED: generic helper to wait for parent window response */
    requestParent (action, payload = {}) {
        if (typeof window === 'undefined' || !window.parent) {
            return Promise.reject(new Error('Parent window not available'));
        }
        const uniquePart = (
            Math.random()
                .toString(36)
                .slice(2)
        );
        const requestId = `solana-${Date.now()}-${uniquePart}`;
        
        return new Promise((resolve, reject) => {
            Solana.pendingRequests[requestId] = {resolve, reject};
            window.parent.postMessage({
                source: 'alpha-iframe',
                action,
                payload,
                requestId
            }, '*');
            // Optional timeout in case parent never replies (30s)
            setTimeout(() => {
                if (Solana.pendingRequests[requestId]) {
                    delete Solana.pendingRequests[requestId];
                    reject(new Error(`Parent did not respond to ${action}`));
                }
            }, 30000);
        });
    }

    /* ADDED: handle replies coming back from parent */
    handleParentResponse (event) {
        const {data} = event;
        if (!data || data.source !== 'alpha-parent') return;
        const {requestId, result, error} = data;
        const pending = Solana.pendingRequests[requestId];
        if (pending) {
            if (error) pending.reject(new Error(error));
            else pending.resolve(result);
            delete Solana.pendingRequests[requestId];
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'solana',
            name: 'Solana',
            color1: '#5A00B3',
            color2: '#5A00B3',
            menuIconURI: MenuiconURI,
            blocks: [
                {
                    opcode: 'getUserPublicKey',
                    blockType: BlockType.REPORTER,
                    text: 'Player Address',
                    arguments: {
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'setNet',
                    blockType: BlockType.COMMAND,
                    text: '[SOLANA] Set RPC Url to [net]',
                    arguments: {
                        net: {
                            type: ArgumentType.STRING,
                            menu: 'networks'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                // {
                //     opcode: 'setCustomNet',
                //     blockType: BlockType.COMMAND,
                //     text: '[SOLANA] Set RPC Url to [net]',
                //     arguments: {
                //         net: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'https://api.devnet.solana.com'
                //         },
                //         SOLANA: {
                //             type: ArgumentType.IMAGE,
                //             dataURI: blockIconURI
                //         }
                //     }
                // },

                {
                    opcode: 'log',
                    blockType: BlockType.COMMAND,
                    text: '[SOLANA] Console log [msg]',
                    arguments: {
                        msg: {
                            type: ArgumentType.STRING,
                            defaultValue: 'message'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'execute',
                    blockType: BlockType.COMMAND,
                    text: '[SOLANA] Execute [cmd]',
                    arguments: {
                        cmd: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Command'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'checkBalance',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Check Balance of [address]',
                    arguments: {
                        address: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PubKey'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'receiveSol',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Receive [amount] Sol from User to [address]',
                    arguments: {
                        address: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PubKey'
                        },
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'receiveToken',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Receive [amount] of mint [ca] from User to [address]',
                    arguments: {
                        address: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PubKey'
                        },
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        ca: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Contract Address'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'requestFunds',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Request [amount] SOL from Devnet Faucet to [pubkey]',
                    arguments: {
                        pubkey: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Public Key'
                        },
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'burnToken',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Burn [amount] of mint [ca] from token account',
                    arguments: {
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        ca: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Contract Address'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'sendSol',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Send [amount] Sol from [private] to [address]',
                    arguments: {
                        private: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PrivateKey'
                        },
                        address: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PubKey'
                        },
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'sendToken',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Send [amount] of mint [ca] from [private] to [address]',
                    arguments: {
                        ca: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Contract Address'
                        },
                        private: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PrivateKey'
                        },
                        address: {
                            type: ArgumentType.STRING,
                            defaultValue: 'PubKey'
                        },
                        amount: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                // {
                //     opcode: 'deployToken',
                //     blockType: BlockType.REPORTER,
                //     text: '[SOLANA] Deploy token by [privateKey] with Decimals:[decimals]',
                //     arguments: {
                //         privateKey: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'Private Key'
                //         },
                //         decimals: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 9
                //         },
                //         SOLANA: {
                //             type: ArgumentType.IMAGE,
                //             dataURI: blockIconURI
                //         }
                //     }
                // },

                {
                    opcode: 'newWallet',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Create new wallet',
                    arguments: {
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
                        }
                    }
                },

                {
                    opcode: 'getPublicKey',
                    blockType: BlockType.REPORTER,
                    text: '[SOLANA] Get Public Key of [privateKey]',
                    arguments: {
                        privateKey: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Private Key'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: blockIconURI
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

    /**
     * Example opcode just returns the name of the stage target.
     * @returns {string} The name of the first target in the project.
     */
    exampleOpcode () {
        const stage = this.runtime.getTargetForStage();
        return stage ? stage.getName() : 'no stage yet';
    }

    async getUserPublicKey () {
        // First try parent window
        try {
            const {publicKey} = await this.requestParent('getPublicKey');
            if (publicKey) {
                return publicKey;
            }
        } catch (error) {
            // Only log once, not repeatedly
            if (!Solana._loggedParentError) {
                console.log('Parent wallet error for getUserPublicKey:', error.message);
                Solana._loggedParentError = true;
            }
        }

        // Fallback to local wallet - COMMENTED OUT
        /*
        try {
            if (Solana.wallet) {
                if (!Solana.wallet.connected) {
                    await Solana.wallet.connect();
                }
                if (Solana.wallet.connected) {
                    return Solana.wallet.publicKey.toString();
                }
            }
        } catch (error) {
            console.error('Error getting public key:', error);
        }
        */
        
        return null;
    }

    setNet (args) {
        if (args.net === 'devnet') {
            Solana.net = 'https://api.devnet.solana.com';
        } else if (args.net === 'testnet') {
            Solana.net = 'https://api.testnet.solana.com';
        } else if (args.net === 'mainnet-beta') {
            Solana.net = 'https://flying-torrie-fast-mainnet.helius-rpc.com';
        } else {
            Solana.net = args.net;
        }
    }

    setCustomNet (args) {
        Solana.net = args.net;
    }

    log (args) {
        console.log(args.msg);
    }

    execute (args) {
        console.log(args.cmd);
    }

    async checkBalance (args) {
        const address = args.address;
        const connection = new web3.Connection(Solana.net);
        const pubkey = new web3.PublicKey(address);
        const balance = await connection.getBalance(pubkey);
        return balance / web3.LAMPORTS_PER_SOL;
    }

    async receiveSol (args) {
        const address = args.address;
        const amount = args.amount;
        const to = new web3.PublicKey(address);
        
        // First try parent window with dedicated action
        try {
            const {publicKey} = await this.requestParent('getPublicKey');
            if (publicKey) {
                const userPublicKey = new web3.PublicKey(publicKey);
                
                // Use dedicated parent action for SOL transfer (like jupiterSwap)
                const {signature} = await this.requestParent('solanaTransferSol', {
                    fromPubkey: userPublicKey.toString(),
                    toPubkey: to.toString(),
                    amount: amount,
                    rpcEndpoint: Solana.net
                });
                
                if (signature) {
                    return signature;
                }
            }
        } catch (error) {
            console.log('Parent wallet error for receiveSol:', error.message);
        }

        return null;
    }

    async receiveToken (args) {
        const address = args.address;
        const amount = args.amount;
        const mint = new web3.PublicKey(args.ca);
        const to = new web3.PublicKey(address);
        
        // First try parent window with dedicated action
        try {
            const {publicKey} = await this.requestParent('getPublicKey');
            if (publicKey) {
                const userPublicKey = new web3.PublicKey(publicKey);
                
                // Check if it's wrapped SOL
                const SOL_MINT = new web3.PublicKey('So11111111111111111111111111111111111111112');
                const isWrappedSOL = mint.equals(SOL_MINT);

                if (isWrappedSOL) {
                    // For wrapped SOL, use the SOL transfer action
                    const {signature} = await this.requestParent('solanaTransferSol', {
                        fromPubkey: userPublicKey.toString(),
                        toPubkey: to.toString(),
                        amount: amount,
                        rpcEndpoint: Solana.net
                    });
                    
                    if (signature) {
                        return signature;
                    }
                } else {
                    // For regular tokens, use dedicated token transfer action (like jupiterSwap)
                    const {signature} = await this.requestParent('solanaTransferToken', {
                        fromPubkey: userPublicKey.toString(),
                        toPubkey: to.toString(),
                        mint: mint.toString(),
                        amount: amount,
                        rpcEndpoint: Solana.net
                    });
                    
                    if (signature) {
                        return signature;
                    }
                }
            }
        } catch (error) {
            console.log('Parent wallet error for receiveToken:', error.message);
        }

        return null;
    }

    async sendSol (args) {
        const address = args.address;
        const amount = args.amount;
        const from = args.private;
        const fromSecretKey = bs58.default.decode(from);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const to = new web3.PublicKey(address);
        const connection = new web3.Connection(Solana.net);
        await connection.getLatestBlockhash();
        const transaction = new web3.Transaction().add(
            web3.SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: to,
                lamports: amount * web3.LAMPORTS_PER_SOL
            })
        );
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = fromKeypair.publicKey;
        const signature = await web3.sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
        return signature.signature.toString();
    }

    async sendToken (args) {
        const address = args.address;
        const amount = args.amount;
        const from = args.private;
        const mint = new web3.PublicKey(args.ca);
        const connection = new web3.Connection(Solana.net);
        const fromSecretKey = bs58.default.decode(from);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const to = new web3.PublicKey(address);
        const fromAta = await token.getAssociatedTokenAddress(mint, fromKeypair.publicKey);
        const toAta = await token.getAssociatedTokenAddress(mint, to);
        const toAtaInfo = await connection.getAccountInfo(toAta);
        const transaction = new web3.Transaction();
        if (!toAtaInfo) {
            transaction.add(
                token.createAssociatedTokenAccountInstruction(
                    fromKeypair.publicKey,
                    toAta,
                    to,
                    mint
                )
            );
        }
        const mintInfo = await token.getMint(connection, mint);
        const adjustedAmount = amount * Math.pow(10, mintInfo.decimals);
        await connection.getLatestBlockhash();
        transaction.add(
            token.createTransferInstruction(
                fromAta,
                toAta,
                fromKeypair.publicKey,
                adjustedAmount
            )
        );
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.feePayer = fromKeypair.publicKey;
        const signature = await web3.sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
        return signature.signature.toString();
    }

    async deployToken (args) {
        const privateKey = args.privateKey;
        const decimals = args.decimals;
        const connection = new web3.Connection(Solana.net);
        const fromSecretKey = bs58.default.decode(privateKey);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const mint = await token.createMint(
            connection,
            fromKeypair,
            fromKeypair.publicKey,
            null,
            decimals
        );
    
        return mint.toString();
    }

    async requestFunds (args) {
        const pubkey = args.pubkey;
        const amount = args.amount;
        const to = new web3.PublicKey(pubkey);
        const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
        try {
            const signature = await connection.requestAirdrop(to, amount * web3.LAMPORTS_PER_SOL);
            return signature.toString();
        } catch (error) {
            console.error(error);
        }
    }

    async burnToken (args) {
        const amount = args.amount;
        const mint = new web3.PublicKey(args.ca);
        
        // First try parent window with dedicated action
        try {
            const {publicKey} = await this.requestParent('getPublicKey');
            if (publicKey) {
                const userPublicKey = new web3.PublicKey(publicKey);
                
                // Use dedicated parent action for token burning
                const {signature} = await this.requestParent('solanaBurnToken', {
                    ownerPubkey: userPublicKey.toString(),
                    mint: mint.toString(),
                    amount: amount,
                    rpcEndpoint: Solana.net
                });
                
                if (signature) {
                    return signature;
                }
            }
        } catch (error) {
            console.log('Parent wallet error for burnToken:', error.message);
        }

        return null;
    }

    newWallet () {
        const fromKeypair = web3.Keypair.generate();
        return bs58.default.encode(fromKeypair.secretKey).toString();
    }

    getPublicKey (args) {
        const privateKey = args.privateKey;
        const fromSecretKey = bs58.default.decode(privateKey);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        return fromKeypair.publicKey.toString();
    }

}

module.exports = Solana;
