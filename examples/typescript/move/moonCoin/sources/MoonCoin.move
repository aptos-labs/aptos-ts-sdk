module MoonCoin::moon_coin {
    use std::string;
    use std::error;
    use std::signer;
    use std::option::{Self};
    
    use aptos_framework::coin::{Self, BurnCapability, FreezeCapability, MintCapability};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;

    const ENO_CAPABILITIES: u64 = 1;
    const ENO_METADATA: u64 = 2;

    struct Capabilities<phantom CoinType> has key {
        burn_cap: BurnCapability<CoinType>,
        freeze_cap: FreezeCapability<CoinType>,
        mint_cap: MintCapability<CoinType>,
    }

    struct MoonCoin {}

    fun init_module(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<MoonCoin>(
            account,
            string::utf8(b"Moon Coin"),
            string::utf8(b"MOON"),
            6,
            false,
        );

        move_to(account, Capabilities<MoonCoin> {
            burn_cap,
            freeze_cap,
            mint_cap,
        });
    }

    // Getters

    #[view]
    public fun get_metadata(): Object<Metadata> {
        option::extract(&mut coin::paired_metadata<MoonCoin>())
    }

    #[view]
    public fun get_secondary_store(account: address, seed: vector<u8>): Object<FungibleStore> {
        let asset_address = object::create_object_address(&account, seed);
        object::address_to_object<FungibleStore>(asset_address)
    }

    // Functionality

    public entry fun mint(account: &signer, to: address, amount: u64) acquires Capabilities {
        let capabilities = borrow_capabilities(account);
        let coins_minted = coin::mint(amount, &capabilities.mint_cap);
        coin::deposit(to, coins_minted);
    }

    public entry fun mint_fa_and_deposit(account: &signer, store: Object<FungibleStore>, amount: u64) acquires Capabilities {
        let fa = mint_fa(account,  amount);
        let capabilities = borrow_capabilities(account);

        let (fa_transfer_ref, fa_transfer_receipt) = aptos_framework::coin::get_paired_transfer_ref<MoonCoin>(&capabilities.freeze_cap);
        fungible_asset::deposit_with_ref(&fa_transfer_ref ,store, fa);

        aptos_framework::coin::return_paired_transfer_ref(fa_transfer_ref, fa_transfer_receipt);
    }

    public entry fun freeze_account(account: &signer, owner: address) acquires Capabilities {
        let capabilities = borrow_capabilities(account);

        let (fa_transfer_ref, fa_transfer_receipt) = aptos_framework::coin::get_paired_transfer_ref<MoonCoin>(&capabilities.freeze_cap);
        let metadata = get_metadata();
        let wallet = primary_fungible_store::ensure_primary_store_exists(owner, metadata);
        fungible_asset::set_frozen_flag(&fa_transfer_ref, wallet, true);

        aptos_framework::coin::return_paired_transfer_ref(fa_transfer_ref, fa_transfer_receipt);
    }

    public entry fun unfreeze_account(account: &signer, owner: address) acquires Capabilities {
        let capabilities = borrow_capabilities(account);

        let (fa_transfer_ref, fa_transfer_receipt) = aptos_framework::coin::get_paired_transfer_ref<MoonCoin>(&capabilities.freeze_cap);
        let metadata = get_metadata();
        let wallet = primary_fungible_store::ensure_primary_store_exists(owner, metadata);
        fungible_asset::set_frozen_flag(&fa_transfer_ref, wallet, false);

        aptos_framework::coin::return_paired_transfer_ref(fa_transfer_ref, fa_transfer_receipt);
    }

    // Helpers

    public entry fun create_secondary_store(account: &signer, seed: vector<u8>)  {
        let metadata = get_metadata();
        let constructor_ref = &object::create_named_object(account, seed);
        fungible_asset::create_store(constructor_ref, metadata);
    }

    fun mint_fa(account: &signer, amount: u64): fungible_asset::FungibleAsset acquires Capabilities {
        let capabilities = borrow_capabilities(account);
        let (fa_mint_ref, fa_mint_receipt) = aptos_framework::coin::get_paired_mint_ref<MoonCoin>(&capabilities.mint_cap);
        let fa = fungible_asset::mint(&fa_mint_ref, amount);
        aptos_framework::coin::return_paired_mint_ref(fa_mint_ref, fa_mint_receipt);

        fa
    }

    inline fun borrow_capabilities(account: &signer): &Capabilities<MoonCoin> acquires Capabilities {
        let account_addr = signer::address_of(account);

        assert!(
            exists<Capabilities<MoonCoin>>(account_addr),
            error::not_found(ENO_CAPABILITIES),
        );

        borrow_global<Capabilities<MoonCoin>>(account_addr)
    }

}