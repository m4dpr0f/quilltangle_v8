# Send RC

This is Send rc V1

## Features

- Player registration system
- Step counting mechanism
- Coin collection system
- Ephemeral rollups integration for faster transactions
- Delegated account management

## Prerequisites

- Rust and Cargo
- Solana Tool Suite
- Node.js and Yarn
- Anchor Framework

## Installation

1. Clone the repository:

2. Install dependencies:

```bash
yarn install
```

3. Build the program:

```bash
anchor build
```

## Configuration

1. Create a `keys` directory and add the following key files:

   - `admin.json`: Admin wallet keypair
   - `usermain.json`: User wallet keypair (for testing)

2. Update the `Anchor.toml` file with your desired cluster and wallet configuration.

## Contract Structure

### State Accounts

1. **Player Account**
   - `owner`: Player's wallet public key
   - `step_count`: Number of steps taken
   - `coins_count`: Number of coins collected

### Instructions

1. **Register Player**

   - Initializes a new player account
   - Creates PDA for player data storage

2. **Increment Step**

   - Increases player's step count
   - Requires player authorization
   - Can be executed on main chain or ephemeral rollup

3. **Collect Coins**

   - Increases player's coin count
   - Requires player authorization
   - Can be executed on main chain or ephemeral rollup

4. **Delegate**

   - Delegates player account to ephemeral rollup
   - Enables faster and cheaper transactions

5. **Undelegate**
   - Returns player account control from ephemeral rollup to main chain
   - Commits state changes back to main chain

## Usage

### Local Development

1. Start a local Solana validator:

```bash
solana-test-validator
```

2. Run tests:

```bash
anchor test
```

### Deployment

1. Build the program:

```bash
anchor build
```

2. Deploy to desired cluster:

```bash
anchor deploy
```

### Interacting with the Contract

Example of registering a player:

```typescript
const tx = await program.methods
  .registerPlayer()
  .accounts({
    user: userWallet.publicKey,
    player: playerPda,
    systemProgram: web3.SystemProgram.programId,
  })
  .signers([userWallet])
  .rpc();
```

Example of incrementing steps:

```typescript
const tx = await program.methods
  .incrementStep()
  .accounts({
    user: userWallet.publicKey,
    admin: adminWallet.publicKey,
  })
  .signers([userWallet, adminWallet])
  .rpc();
```

## Ephemeral Rollups Integration

The contract supports ephemeral rollups through the `@magicblock-labs/ephemeral-rollups-sdk`. This enables:

- Faster transaction processing
- Reduced transaction costs
- Improved scalability

To use ephemeral rollups:

1. Delegate account:

```typescript
await program.methods
  .delegate()
  .accounts({
    user: userWallet.publicKey,
  })
  .signers([userWallet])
  .rpc();
```

2. Perform actions on rollup:

```typescript
await ephemeralProgram.methods
  .incrementStep()
  .accounts({
    user: userWallet.publicKey,
    admin: adminWallet.publicKey,
  })
  .signers([userWallet, adminWallet])
  .rpc();
```

3. Undelegate to commit changes:

```typescript
await ephemeralProgram.methods
  .undelegate()
  .accounts({
    user: userWallet.publicKey,
  })
  .signers([userWallet, adminWallet])
  .rpc();
```

## Security Considerations

- Admin key is required for certain operations
- Player operations are protected by owner checks
- Delegation operations are protected by proper authorization
- State changes are atomic and protected against reentrancy

## License

ISC
