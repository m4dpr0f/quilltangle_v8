/* eslint-disable camelcase */
const BlockType = require('../extension-support/block-type');
const ArgumentType = require('../extension-support/argument-type');
const web3 = require('@solana/web3.js');
const bs58 = require('bs58');
const {Buffer} = require('buffer');

// eslint-disable-next-line max-len
const SendIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzQyIiBoZWlnaHQ9Ijc0MiIgdmlld0JveD0iMCAwIDc0MiA3NDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzcxIDc0MkM1NzUuODk4IDc0MiA3NDIgNTc1Ljg5OCA3NDIgMzcxQzc0MiAxNjYuMTAyIDU3NS44OTggMCAzNzEgMEMxNjYuMTAyIDAgMCAxNjYuMTAyIDAgMzcxQzAgNTc1Ljg5OCAxNjYuMTAyIDc0MiAzNzEgNzQyWk01NjEuNjc0IDI4Ny43MzRDNTE4LjE0IDI3MS40NTMgNDkzLjY5MSAyNjMuNjAyIDQ1OC42NjUgMjYwLjMwNEM0NDkuMDcgMjU5LjQwMSA0NDAuNTU5IDI2Ni40NDcgNDM5LjY1NiAyNzYuMDQzQzQzOC43NTIgMjg1LjYzOSA0NDUuNzk5IDI5NC4xNSA0NTUuMzk0IDI5NS4wNTNDNDc0LjA0MSAyOTYuODA4IDQ4OS4xMzMgMjk5Ljk0MiA1MDguMDI4IDMwNS44NTFDNDk2Ljg4MSAzMTAuODQyIDQ4Ny42NTYgMzE1LjIyMSA0NzkuMzUyIDMxOS43OUM0NjEuOTA3IDMyOS4zODkgNDQ4LjQzNCAzMzkuODIgNDI4LjgzIDM1Ny43NThDNDIxLjcyIDM2NC4yNjQgNDIxLjIzIDM3NS4zMDIgNDI3LjczNiAzODIuNDEzQzQzNC4yNDIgMzg5LjUyMyA0NDUuMjggMzkwLjAxMyA0NTIuMzkxIDM4My41MDdDNDcwLjkyNiAzNjYuNTQ4IDQ4Mi4wOTcgMzU4LjExNiA0OTYuMTc3IDM1MC4zNjlDNTA2LjAwNCAzNDQuOTYyIDUxNy4yMTkgMzM5Ljg4NCA1MzMuMzc2IDMzMi44MTFDNTI5LjgxNyAzNTAuNjc2IDUyNS4xNTIgMzY0LjYyIDUxNi41OTYgMzgzLjA3MkM1MTIuNTQxIDM5MS44MTYgNTE2LjM0MyA0MDIuMTkxIDUyNS4wODYgNDA2LjI0NUM1MzMuODMgNDEwLjMgNTQ0LjIwNSA0MDYuNDk4IDU0OC4yNTkgMzk3Ljc1NUM1NjMuMTA2IDM2NS43MzcgNTY3Ljg1NSAzNDQuNDM3IDU3Mi44NjMgMzA2LjM1NUM1NzMuOTIyIDI5OC4zIDU2OS4yODMgMjkwLjU4IDU2MS42NzQgMjg3LjczNFpNMjk3LjYwOCA0NzkuMDcxQzI5My42MTEgNDY2LjgxOSAzMDQuNDAzIDQ1Ni4xMjIgMzE3LjI5IDQ1Ni4xMjJINDI0LjA4N0M0MzYuOTc0IDQ1Ni4xMjIgNDQ3Ljc2NiA0NjYuODE5IDQ0My43NjkgNDc5LjA3MUM0NDMuMTIzIDQ4MS4wNSA0NDIuMzkzIDQ4My4wMDUgNDQxLjU4IDQ4NC45MzJDNDM3LjcyNCA0OTQuMDY2IDQzMi4wNzIgNTAyLjM2NSA0MjQuOTQ3IDUwOS4zNTZDNDE3LjgyMSA1MTYuMzQ3IDQwOS4zNjIgNTIxLjg5MiA0MDAuMDUzIDUyNS42NzZDMzkwLjc0MyA1MjkuNDU5IDM4MC43NjUgNTMxLjQwNiAzNzAuNjg5IDUzMS40MDZDMzYwLjYxMiA1MzEuNDA2IDM1MC42MzQgNTI5LjQ1OSAzNDEuMzI0IDUyNS42NzZDMzMyLjAxNSA1MjEuODkyIDMyMy41NTYgNTE2LjM0NyAzMTYuNDMgNTA5LjM1NkMzMDkuMzA1IDUwMi4zNjUgMzAzLjY1MyA0OTQuMDY2IDI5OS43OTcgNDg0LjkzMkMyOTguOTg0IDQ4My4wMDUgMjk4LjI1NCA0ODEuMDUgMjk3LjYwOCA0NzkuMDcxWk0xNzQuOTM3IDI4OS4yNEMyMDYuOTE5IDI3NC41ODMgMjMyLjAxOCAyNjkuMTU4IDI3Ny44NiAyNjEuNDkxQzI4NS44NzMgMjYwLjE1MSAyOTMuNzUgMjY0LjUxOCAyOTYuODYgMjcyLjAyM0MzMTEuNTY1IDMwNy41MDcgMzE4LjEwMiAzMjguMzI4IDMyMS4yNTMgMzYzLjQ3OUMzMjIuMTE0IDM3My4wNzggMzE1LjAyOSAzODEuNTU4IDMwNS40MyAzODIuNDE4QzI5NS44MyAzODMuMjc5IDI4Ny4zNTEgMzc2LjE5NSAyODYuNDkgMzY2LjU5NUMyODQuNjc0IDM0Ni4zMzcgMjgxLjc0MyAzMzEuOTI5IDI3NS44OTIgMzE0LjY3OEMyNjUuNDM2IDMyOC44ODEgMjU4LjI2MyAzMzguODg3IDI1Mi40NTYgMzQ4LjQ4M0MyNDQuMTM2IDM2Mi4yMzIgMjM4LjY3NyAzNzUuMTIgMjMxLjEwNSAzOTkuMDc0QzIyOC4yIDQwOC4yNjQgMjE4LjM5NiA0MTMuMzU5IDIwOS4yMDYgNDEwLjQ1NEMyMDAuMDE2IDQwNy41NDkgMTk0LjkyMSAzOTcuNzQ1IDE5Ny44MjYgMzg4LjU1NUMyMDUuODM0IDM2My4yMTkgMjEyLjI4NyAzNDcuNDQ5IDIyMi41OTUgMzMwLjQxNEMyMjcuNTAyIDMyMi4zMDUgMjMzLjMwMiAzMTMuOSAyNDAuNDYgMzA0LjAwNEMyMjEuMTQyIDMwOC4zMzQgMjA2LjUwNSAzMTMuMTY2IDE4OS40NzkgMzIwLjk2OUMxODAuNzE3IDMyNC45ODQgMTcwLjM1OSAzMjEuMTM3IDE2Ni4zNDQgMzEyLjM3NUMxNjIuMzI4IDMwMy42MTQgMTY2LjE3NiAyOTMuMjU2IDE3NC45MzcgMjg5LjI0WiIgZmlsbD0iIzI2NThERCIvPgo8L3N2Zz4K';
// eslint-disable-next-line max-len
const MenuiconURI = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzQyIiBoZWlnaHQ9Ijc0MiIgdmlld0JveD0iMCAwIDc0MiA3NDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzcxIDc0MkM1NzUuODk4IDc0MiA3NDIgNTc1Ljg5OCA3NDIgMzcxQzc0MiAxNjYuMTAyIDU3NS44OTggMCAzNzEgMEMxNjYuMTAyIDAgMCAxNjYuMTAyIDAgMzcxQzAgNTc1Ljg5OCAxNjYuMTAyIDc0MiAzNzEgNzQyWk01NjEuNjc0IDI4Ny43MzRDNTE4LjE0IDI3MS40NTMgNDkzLjY5MSAyNjMuNjAyIDQ1OC42NjUgMjYwLjMwNEM0NDkuMDcgMjU5LjQwMSA0NDAuNTU5IDI2Ni40NDcgNDM5LjY1NiAyNzYuMDQzQzQzOC43NTIgMjg1LjYzOSA0NDUuNzk5IDI5NC4xNSA0NTUuMzk0IDI5NS4wNTNDNDc0LjA0MSAyOTYuODA4IDQ4OS4xMzMgMjk5Ljk0MiA1MDguMDI4IDMwNS44NTFDNDk2Ljg4MSAzMTAuODQyIDQ4Ny42NTYgMzE1LjIyMSA0NzkuMzUyIDMxOS43OUM0NjEuOTA3IDMyOS4zODkgNDQ4LjQzNCAzMzkuODIgNDI4LjgzIDM1Ny43NThDNDIxLjcyIDM2NC4yNjQgNDIxLjIzIDM3NS4zMDIgNDI3LjczNiAzODIuNDEzQzQzNC4yNDIgMzg5LjUyMyA0NDUuMjggMzkwLjAxMyA0NTIuMzkxIDM4My41MDdDNDcwLjkyNiAzNjYuNTQ4IDQ4Mi4wOTcgMzU4LjExNiA0OTYuMTc3IDM1MC4zNjlDNTA2LjAwNCAzNDQuOTYyIDUxNy4yMTkgMzM5Ljg4NCA1MzMuMzc2IDMzMi44MTFDNTI5LjgxNyAzNTAuNjc2IDUyNS4xNTIgMzY0LjYyIDUxNi41OTYgMzgzLjA3MkM1MTIuNTQxIDM5MS44MTYgNTE2LjM0MyA0MDIuMTkxIDUyNS4wODYgNDA2LjI0NUM1MzMuODMgNDEwLjMgNTQ0LjIwNSA0MDYuNDk4IDU0OC4yNTkgMzk3Ljc1NUM1NjMuMTA2IDM2NS43MzcgNTY3Ljg1NSAzNDQuNDM3IDU3Mi44NjMgMzA2LjM1NUM1NzMuOTIyIDI5OC4zIDU2OS4yODMgMjkwLjU4IDU2MS42NzQgMjg3LjczNFpNMjk3LjYwOCA0NzkuMDcxQzI5My42MTEgNDY2LjgxOSAzMDQuNDAzIDQ1Ni4xMjIgMzE3LjI5IDQ1Ni4xMjJINDI0LjA4N0M0MzYuOTc0IDQ1Ni4xMjIgNDQ3Ljc2NiA0NjYuODE5IDQ0My43NjkgNDc5LjA3MUM0NDMuMTIzIDQ4MS4wNSA0NDIuMzkzIDQ4My4wMDUgNDQxLjU4IDQ4NC45MzJDNDM3LjcyNCA0OTQuMDY2IDQzMi4wNzIgNTAyLjM2NSA0MjQuOTQ3IDUwOS4zNTZDNDE3LjgyMSA1MTYuMzQ3IDQwOS4zNjIgNTIxLjg5MiA0MDAuMDUzIDUyNS42NzZDMzkwLjc0MyA1MjkuNDU5IDM4MC43NjUgNTMxLjQwNiAzNzAuNjg5IDUzMS40MDZDMzYwLjYxMiA1MzEuNDA2IDM1MC42MzQgNTI5LjQ1OSAzNDEuMzI0IDUyNS42NzZDMzMyLjAxNSA1MjEuODkyIDMyMy41NTYgNTE2LjM0NyAzMTYuNDMgNTA5LjM1NkMzMDkuMzA1IDUwMi4zNjUgMzAzLjY1MyA0OTQuMDY2IDI5OS43OTcgNDg0LjkzMkMyOTguOTg0IDQ4My4wMDUgMjk4LjI1NCA0ODEuMDUgMjk3LjYwOCA0NzkuMDcxWk0xNzQuOTM3IDI4OS4yNEMyMDYuOTE5IDI3NC41ODMgMjMyLjAxOCAyNjkuMTU4IDI3Ny44NiAyNjEuNDkxQzI4NS44NzMgMjYwLjE1MSAyOTMuNzUgMjY0LjUxOCAyOTYuODYgMjcyLjAyM0MzMTEuNTY1IDMwNy41MDcgMzE4LjEwMiAzMjguMzI4IDMyMS4yNTMgMzYzLjQ3OUMzMjIuMTE0IDM3My4wNzggMzE1LjAyOSAzODEuNTU4IDMwNS40MyAzODIuNDE4QzI5NS44MyAzODMuMjc5IDI4Ny4zNTEgMzc2LjE5NSAyODYuNDkgMzY2LjU5NUMyODQuNjc0IDM0Ni4zMzcgMjgxLjc0MyAzMzEuOTI5IDI3NS44OTIgMzE0LjY3OEMyNjUuNDM2IDMyOC44ODEgMjU4LjI2MyAzMzguODg3IDI1Mi40NTYgMzQ4LjQ4M0MyNDQuMTM2IDM2Mi4yMzIgMjM4LjY3NyAzNzUuMTIgMjMxLjEwNSAzOTkuMDc0QzIyOC4yIDQwOC4yNjQgMjE4LjM5NiA0MTMuMzU5IDIwOS4yMDYgNDEwLjQ1NEMyMDAuMDE2IDQwNy41NDkgMTk0LjkyMSAzOTcuNzQ1IDE5Ny44MjYgMzg4LjU1NUMyMDUuODM0IDM2My4yMTkgMjEyLjI4NyAzNDcuNDQ5IDIyMi41OTUgMzMwLjQxNEMyMjcuNTAyIDMyMi4zMDUgMjMzLjMwMiAzMTMuOSAyNDAuNDYgMzA0LjAwNEMyMjEuMTQyIDMwOC4zMzQgMjA2LjUwNSAzMTMuMTY2IDE4OS40NzkgMzIwLjk2OUMxODAuNzE3IDMyNC45ODQgMTcwLjM1OSAzMjEuMTM3IDE2Ni4zNDQgMzEyLjM3NUMxNjIuMzI4IDMwMy42MTQgMTY2LjE3NiAyOTMuMjU2IDE3NC45MzcgMjg5LjI0WiIgZmlsbD0iIzI2NThERCIvPgo8L3N2Zz4K`;

class Send {
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
            id: 'send',
            name: 'Send',
            color1: '#808080',
            color2: '#808080',
            menuIconURI: MenuiconURI,
            blocks: [
                {
                    opcode: 'SEND',
                    blockType: BlockType.REPORTER,
                    text: '[SEND] SEND',
                    arguments: {
                        SEND: {
                            type: ArgumentType.IMAGE,
                            dataURI: SendIconURI
                        }
                    }
                },
                {
                    opcode: 'rpsBlink',
                    blockType: BlockType.COMMAND,
                    text: '[SOLANA] Play RPS Blink with [choice] with [bet] SOL with [privateKey]',
                    arguments: {
                        choice: {
                            type: ArgumentType.STRING,
                            menu: 'rps'
                        },
                        bet: {
                            type: ArgumentType.STRING,
                            menu: 'bets'
                        },
                        privateKey: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Private Key'
                        },
                        SOLANA: {
                            type: ArgumentType.IMAGE,
                            dataURI: SendIconURI
                        }
                    }
                }

            ],
            menus: {
                networks: {
                    acceptReporters: true,
                    items: ['mainnet-beta', 'devnet', 'testnet']
                },
                rps: {
                    acceptReporters: true,
                    items: ['rock', 'paper', 'scissors']
                },
                bets: {
                    acceptReporters: true,
                    items: ['0.1', '0.01', '0.005']
                }
            }
        };
    }

    SEND () {
        return 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa';
    }

    async rpsBlink (args) {
        const choice = args.choice;
        const bet = Number(args.bet);
        const privateKey = args.privateKey;
        const fromSecretKey = bs58.default.decode(privateKey);
        const fromKeypair = web3.Keypair.fromSecretKey(fromSecretKey);
        const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));
        try {
            const res = await fetch(
                `https://rps.sendarcade.fun/api/actions/bot?amount=${bet}&choice=${choice}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: fromKeypair.publicKey.toBase58()
                    })
                }
            );
      
            const data = await res.json();
            if (data.transaction) {
                const txn = web3.Transaction.from(Buffer.from(data.transaction, 'base64'));
                txn.sign(fromKeypair);
                txn.recentBlockhash = (
                    await connection.getLatestBlockhash()
                ).blockhash;
                const sig = await web3.sendAndConfirmTransaction(
                    connection,
                    txn,
                    [fromKeypair],
                    {commitment: 'confirmed'}
                );
                const href = data.links?.next?.href;
                return await this.outcome(fromKeypair, sig, href);
            }
        } catch (error) {
            console.error(error);
            throw new Error(`RPS game failed: ${error.message}`);
        }
    }
    async outcome (fromKeypair, sig, href){
        try {
            const res = await fetch(
                `https://rps.sendarcade.fun${href}`, // href = /api/actions/outcome?id=...
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: fromKeypair.publicKey.toBase58(),
                        signature: sig
                    })
                }
            );
      
            const data = await res.json();
            const title = data.title;
            if (title.startsWith('You lost')) {
                return title;
            }
            const next_href = data.links?.actions?.[0]?.href;
            return `${title}\n${await this.won(fromKeypair, next_href)}`;
        } catch (error) {
            console.error(error);
            throw new Error(`RPS outcome failed: ${error.message}`);
        }
    }
    async won (fromKeypair, href) {
        const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));
        try {
            const res = await fetch(
                `https://rps.sendarcade.fun${href}`, // href = /api/actions/won?id=...
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: fromKeypair.publicKey.toBase58()
                    })
                }
            );
    
            const data = await res.json();
            if (data.transaction) {
                const txn = web3.Transaction.from(Buffer.from(data.transaction, 'base64'));
                txn.partialSign(fromKeypair);
                await connection.sendRawTransaction(txn.serialize(), {
                    preflightCommitment: 'confirmed'
                });
            } else {
                return 'Failed to claim prize.';
            }
            const next_href = data.links?.next?.href;
            return await this.postWin(fromKeypair, next_href);
        } catch (error) {
            console.error(error);
            throw new Error(`RPS outcome failed: ${error.message}`);
        }
    }
    async postWin (fromKeypair, href) {
        try {
            const res = await fetch(
                `https://rps.sendarcade.fun${href}`, // href = /api/actions/postwin?id=...
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        account: fromKeypair.publicKey.toBase58()
                    })
                }
            );
    
            const data = await res.json();
            const title = data.title;
            return `Prize claimed Successfully\n${title}`;
        } catch (error) {
            console.error(error);
            throw new Error(`RPS outcome failed: ${error.message}`);
        }
    }
}

module.exports = Send;
