use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use std::str::FromStr;
declare_id!("CRoSk9Dzo7NhunjizbpA9Z9isrcvJyDn3w1cZFFmHUak");

pub const PLAYER_SEED: &[u8] = b"sol-cross-player";

const ADMIN_KEY: &str = "MYSjg912aTjrZV4H3aU4Q9YgzCu6Y9h9Gyy4pXKJ8pm";

#[ephemeral]
#[program]
pub mod sol_cross {
    use super::*;
    
    /// Register and initialize the player.
    pub fn register_player(ctx: Context<RegisterPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        let user = &ctx.accounts.user;
        
        // Create the admin pubkey at runtime instead of as a constant
        msg!(
            "Registering player pda: {} from user {}",
            player.key(),
            user.key()
        );

        //CHECK: Player is not registered
        require!(
            player.owner != user.key(),
            CustomError::PlayerAlreadyRegistered
        );

        player.owner = user.key();
        player.step_count = 0;
        player.coins_count = 0;

        // Emit event
        emit!(PlayerRegistered {
            player: player.owner,
        });

        msg!("Player registered successfully");
        Ok(())
    }

    /// Increment the step.
    pub fn increment_step(ctx: Context<IncrementWithPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        let user = &ctx.accounts.user;

        msg!("Incrementing step for player: {}", player.owner);

        //CHECK: User needs to be the player
        require!(user.key() == player.owner, CustomError::NotPlayer);

        // Increment step count
        player.step_count += 1;
        msg!("Step count increased to: {}", player.step_count);

        // Emit event
        emit!(StepIncremented {
            player: player.owner,
            step_count: player.step_count,
        });

        msg!("Step incremented successfully");
        Ok(())
    }

    pub fn collect_coins(ctx: Context<CollectCoins>) -> Result<()> {
        // collect coin
        let player = &mut ctx.accounts.player;
        let user = &ctx.accounts.user;

        msg!("Collecting coin for player: {}", player.owner);

        //CHECK: User needs to be the player
        require!(user.key() == player.owner, CustomError::NotPlayer);

        // Increment coins count
        player.coins_count += 1;
        msg!("Coins count increased to: {}", player.coins_count);

        // Emit event
        emit!(CoinCollected {
            player: player.owner,
            coins_count: player.coins_count,
        });

        msg!("Coin collected successfully");
        Ok(())
    }

    /// Delegate the account to the delegation program
    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        let player = &ctx.accounts.player;
        let user = &ctx.accounts.user;

        msg!(
            "Delegating player pda {} from user {}",
            player.key(),
            player.owner
        );

        //CHECK: User needs to be the player
        require!(user.key() == player.owner, CustomError::NotPlayer);
        //CHECK: Admin authority is checked through the PDA constraint in the context

        ctx.accounts.delegate_player(
            &ctx.accounts.user,
            &[PLAYER_SEED, player.owner.as_ref()],
            DelegateConfig::default(),
        )?;

        // Emit event
        emit!(AccountDelegated {
            player: player.owner,
        });

        msg!("Accounts delegated successfully");
        Ok(())
    }

    /// Undelegate the account from the delegation program
    pub fn undelegate(ctx: Context<Undelegate>) -> Result<()> {
        let player = &ctx.accounts.player;
        let user = &ctx.accounts.user;

        msg!(
            "Undelegating player pda {} from user {}",
            player.key(),
            player.owner
        );

        //CHECK: User needs to be the player
        require!(user.key() == player.owner, CustomError::NotPlayer);
        //CHECK: Admin authority is checked through the PDA constraint in the context

        commit_and_undelegate_accounts(
            &ctx.accounts.user,
            vec![&player.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;

        // Emit event
        emit!(AccountUndelegated {
            player: player.owner,
        });

        msg!("Accounts undelegated successfully");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterPlayer<'info> {
    #[account(init_if_needed, payer = user, space = 8 + 32 + 8 + 8, seeds = [PLAYER_SEED, user.key().as_ref()], bump)]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IncrementWithPlayer<'info> {
    #[account(mut, seeds = [PLAYER_SEED, user.key().as_ref()], bump)]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = admin.key() == Pubkey::from_str(ADMIN_KEY).unwrap().key())]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectCoins<'info> {
    #[account(mut, seeds = [PLAYER_SEED, user.key().as_ref()], bump)]
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = admin.key() == Pubkey::from_str(ADMIN_KEY).unwrap().key())]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK The pda to delegate
    #[account(mut, del, seeds = [PLAYER_SEED, user.key().as_ref()], bump)]
    pub player: Account<'info, Player>,

    pub system_program: Program<'info, System>,
}

/// Account for the increment instruction + manual commit.
#[commit]
#[derive(Accounts)]
pub struct Undelegate<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK The pda to undelegate
    #[account(mut, seeds = [PLAYER_SEED, user.key().as_ref()], bump)]
    pub player: Account<'info, Player>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Debug)]
pub struct Player {
    pub owner: Pubkey,    // Player's wallet
    pub step_count: u64,  // Player's step count
    pub coins_count: u64, // Player's coins count
}

#[error_code]
pub enum CustomError {
    #[msg("The 24-hour period has not ended yet")]
    PeriodNotEnded,
    #[msg("Only the player with the highest step count can claim the prize")]
    NotHighestPlayer,
    #[msg("User needs to be the player")]
    NotPlayer,
    #[msg("Player has reached the step limit")]
    StepLimitReached,
    #[msg("Admin needs to sign the transaction")]
    NotAdmin,
    #[msg("Player already registered")]
    PlayerAlreadyRegistered,
}

#[event]
pub struct PlayerRegistered {
    pub player: Pubkey,
}

#[event]
pub struct StepIncremented {
    pub player: Pubkey,
    pub step_count: u64,
}

#[event]
pub struct CoinCollected {
    pub player: Pubkey,
    pub coins_count: u64,
}

#[event]
pub struct AccountDelegated {
    pub player: Pubkey,
}

#[event]
pub struct AccountUndelegated {
    pub player: Pubkey,
}
