module MoonCoin::tree_coin {
    use std::signer;

    struct TreeCoin {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<TreeCoin>(
            sender,
            b"Tree Coin",
            b"TREE",
            6,
            false,
        );

        aptos_framework::managed_coin::register<TreeCoin>(sender);
        aptos_framework::managed_coin::mint<TreeCoin>(
            sender,
            signer::address_of(sender),
            100000,
        );

        aptos_framework::coin::migrate_to_fungible_store<TreeCoin>(sender);
        
        aptos_framework::managed_coin::mint<TreeCoin>(
            sender,
            signer::address_of(sender),
            50000,
        );
    }
}
