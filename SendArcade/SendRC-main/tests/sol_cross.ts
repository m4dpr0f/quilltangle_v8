import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import { SolCross } from "../target/types/sol_cross";
import { DELEGATION_PROGRAM_ID } from "@magicblock-labs/ephemeral-rollups-sdk";

describe("sol-cross", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const GAME_POOL_SEED = Buffer.from("sol-cross-pool");
  const PLAYER_SEED = Buffer.from("sol-cross-player");

  // Configure the ephemeral rollup endpoint.
  const providerEphemeralRollup = new anchor.AnchorProvider(
    new anchor.web3.Connection(process.env.PROVIDER_ENDPOINT!, {
      wsEndpoint: process.env.WS_ENDPOINT!,
    }),
    anchor.Wallet.local()
  );

  console.log(
    "Provider Endpoint: ",
    // @ts-ignore
    providerEphemeralRollup.connection._rpcEndpoint
  );
  console.log(
    "Provider WS Endpoint: ",
    // @ts-ignore
    providerEphemeralRollup.connection._rpcWsEndpoint
  );

  const program = anchor.workspace.SolCross as Program<SolCross>;
  const ephemeralProgram = new Program(program.idl, providerEphemeralRollup);

  console.log("programId: ", program.programId.toBase58());
  console.log("ephemeralProgramId: ", ephemeralProgram.programId.toBase58());

  const admin = web3.Keypair.fromSecretKey(
    Uint8Array.from(require("../keys/admin.json"))
  );
  console.log("Admin: ", admin.publicKey.toBase58());

  const user = web3.Keypair.fromSecretKey(
    Uint8Array.from(require("../keys/usermain.json"))
  );
  console.log("User: ", user.publicKey.toBase58());

  const gamePoolPda = web3.PublicKey.findProgramAddressSync(
    [GAME_POOL_SEED, admin.publicKey.toBuffer()],
    program.programId
  )[0];

  const playerPda = web3.PublicKey.findProgramAddressSync(
    [PLAYER_SEED, user.publicKey.toBuffer()],
    program.programId
  )[0];

  console.log("Game Pool PDA: ", gamePoolPda.toBase58());
  console.log("Player PDA: ", playerPda.toBase58());

  before(async () => {
    if (true) {
      return;
    }
    const cluster =
      provider.connection.rpcEndpoint.includes("localhost") ||
      provider.connection.rpcEndpoint.includes("127.0.0.1");
    if (cluster) {
      // Airdrop to bob
      const bobAirdropSignature = await provider.connection.requestAirdrop(
        user.publicKey,
        1 * web3.LAMPORTS_PER_SOL
      );
      console.log("Airdrop signature:", bobAirdropSignature);
      // Verify the balance
      const userBalance = await provider.connection.getBalance(user.publicKey);
      console.log(`User balance: ${userBalance / web3.LAMPORTS_PER_SOL} SOL`);
    } else {
      // Transfer 3 SOL from admin to user
      const transferTx = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: admin.publicKey,
          toPubkey: user.publicKey,
          lamports: 1 * web3.LAMPORTS_PER_SOL,
        })
      );

      const signature = await provider.sendAndConfirm(transferTx);
      console.log("Transfer signature:", signature);

      // Verify the balance
      const userBalance = await provider.connection.getBalance(user.publicKey);
      console.log(`User balance: ${userBalance / web3.LAMPORTS_PER_SOL} SOL`);
    }
  });

  it("Register player", async () => {
    const tx = await program.methods
      .registerPlayer()
      .accounts({
        user: user.publicKey,
        // @ts-ignore
        player: playerPda,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc({ skipPreflight: true });
    console.log("Register Player Tx: ", tx);

    const playerAccount = await program.account.player.fetch(playerPda);
    console.log("Player: ", playerAccount.owner.toBase58());
    console.log("Player step count: ", playerAccount.stepCount.toString());
    console.log("Player coins count: ", playerAccount.coinsCount.toString());
  });

  it("is player delegated", async () => {
    const playerAccountInfo = await provider.connection.getAccountInfo(
      playerPda
    );
    if (
      playerAccountInfo.owner.toBase58() == DELEGATION_PROGRAM_ID.toBase58()
    ) {
      console.log(
        "Player PDA is delegated!!, Moving player on ephemeral rollup..."
      );
    } else {
      console.log("Player PDA is not delegated");
    }
  });

  it("Move player", async () => {
    const playerAccountInfo = await provider.connection.getAccountInfo(
      playerPda
    );
    if (
      playerAccountInfo.owner.toBase58() == DELEGATION_PROGRAM_ID.toBase58()
    ) {
      console.log(
        "Player PDA is delegated!!, Moving player on ephemeral rollup..."
      );
      const start = performance.now();
      const tx = await ephemeralProgram.methods
        .incrementStep()
        .accounts({
          user: user.publicKey,
          admin: admin.publicKey,
        })
        .signers([user, admin])
        .rpc({ skipPreflight: true });
      const end = performance.now();
      console.log("Move Player Tx on ephemeral rollup: ", tx);
      console.log(`Time taken: ${end - start} milliseconds`);
      // after move
      const playerAccountAfter = await ephemeralProgram.account.player.fetch(
        playerPda
      );
      console.log(
        "Player step count after: ",
        playerAccountAfter.stepCount.toString()
      );
      console.log(
        "Player coins count after: ",
        playerAccountAfter.coinsCount.toString()
      );
      return;
    }
    // before move
    const playerAccountBefore = await program.account.player.fetch(playerPda);
    console.log(
      "Player step count before: ",
      playerAccountBefore.stepCount.toString()
    );
    console.log(
      "Player coins count before: ",
      playerAccountBefore.coinsCount.toString()
    );

    const start = performance.now();
    const tx = await program.methods
      .incrementStep()
      .accounts({
        user: user.publicKey,
        admin: admin.publicKey,
      })
      .signers([user, admin])
      .rpc({ skipPreflight: true });
    const end = performance.now();
    console.log("Move Player Tx: ", tx);
    console.log(`Time taken: ${end - start} milliseconds`);
    // after move
    const playerAccountAfter = await program.account.player.fetch(playerPda);
    console.log(
      "Player step count after: ",
      playerAccountAfter.stepCount.toString()
    );
    console.log(
      "Player coins count after: ",
      playerAccountAfter.coinsCount.toString()
    );
  });

  it("Collect coins", async () => {
    const playerAccountInfo = await provider.connection.getAccountInfo(
      playerPda
    );
    if (
      playerAccountInfo.owner.toBase58() == DELEGATION_PROGRAM_ID.toBase58()
    ) {
      console.log(
        "Player PDA is delegated, collecting coins on ephemeral rollup..."
      );
      const start = performance.now();
      const tx = await ephemeralProgram.methods
        .collectCoins()
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc({ skipPreflight: true });
      const end = performance.now();
      console.log("Collect Coins Tx on ephemeral rollup: ", tx);
      console.log(`Time taken: ${end - start} milliseconds`);
      // after collect
      const playerAccountAfter = await ephemeralProgram.account.player.fetch(
        playerPda
      );
      console.log(
        "Player step count after: ",
        playerAccountAfter.stepCount.toString()
      );
      console.log(
        "Player coins count after: ",
        playerAccountAfter.coinsCount.toString()
      );
      return;
    }
    // before collect
    const playerAccountBefore = await program.account.player.fetch(playerPda);
    console.log(
      "Player step count before: ",
      playerAccountBefore.stepCount.toString()
    );
    console.log(
      "Player coins count before: ",
      playerAccountBefore.coinsCount.toString()
    );
    const newAdmin = web3.Keypair.fromSecretKey(
      Uint8Array.from(require("../keys/admin.json"))
    );

    const tx = await program.methods
      .collectCoins()
      .accounts({
        user: user.publicKey,
        admin: newAdmin.publicKey,
      })
      .signers([user])
      .rpc({ skipPreflight: true });
    console.log("Collect Coins Tx: ", tx);

    // after collect
    const playerAccountAfter = await program.account.player.fetch(playerPda);
    console.log(
      "Player step count after: ",
      playerAccountAfter.stepCount.toString()
    );
    console.log(
      "Player coins count after: ",
      playerAccountAfter.coinsCount.toString()
    );
  });

  it("Delegate playerPda and gamePoolPda to ephemeral rollup", async () => {
    const playerAccountInfo = await provider.connection.getAccountInfo(
      playerPda
    );
    if (
      playerAccountInfo.owner.toBase58() == DELEGATION_PROGRAM_ID.toBase58()
    ) {
      console.log("Player PDA is already delegated");
      return;
    }

    let tx = await program.methods
      .delegate()
      .accounts({
        user: user.publicKey,
      })
      .signers([user])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log("Delegation signature", tx);
  });

  it("Perform Move Player in the ephemeral rollup", async () => {
    // before move
    const playerAccountBefore = await ephemeralProgram.account.player.fetch(
      playerPda
    );
    console.log(
      "Player step count before: ",
      playerAccountBefore.stepCount.toString()
    );
    console.log(
      "Player coins count before: ",
      playerAccountBefore.coinsCount.toString()
    );

    const start = performance.now();
    const tx = await ephemeralProgram.methods
      .incrementStep()
      .accounts({
        user: user.publicKey,
        admin: admin.publicKey,
      })
      .signers([user, admin])
      .rpc({ skipPreflight: true });
    const end = performance.now();
    console.log("Move Player Tx on ephemeral rollup: ", tx);
    console.log(`Time taken: ${end - start} milliseconds`);
    // after move
    const playerAccountAfter = await ephemeralProgram.account.player.fetch(
      playerPda
    );
    console.log(
      "Player step count after: ",
      playerAccountAfter.stepCount.toString()
    );
    console.log(
      "Player coins count after: ",
      playerAccountAfter.coinsCount.toString()
    );
  });

  it("Undelegate PlayerPda and GamePoolPda", async () => {
    const playerAccountInfo = await provider.connection.getAccountInfo(
      playerPda
    );
    if (
      playerAccountInfo.owner.toBase58() != DELEGATION_PROGRAM_ID.toBase58()
    ) {
      console.log("Player PDA is not delegated");
      return;
    }
    let tx = await ephemeralProgram.methods
      .undelegate()
      .accounts({
        user: user.publicKey,
      })
      .signers([user, admin])
      .rpc({ skipPreflight: true });
    console.log("Undelegation signature", tx);
  });
});
