module MoonCoin::moon_coin {
    use std::signer;

    struct MoonCoin {}

    fun init_module(sender: &signer) {
        aptos_framework::managed_coin::initialize<MoonCoin>(
            sender,
            b"Moon Coin",
            b"MOON",
            6,
            false,
        );

        // aptos_framework::managed_coin::register<MoonCoin>(sender);
        // aptos_framework::managed_coin::mint<MoonCoin>(
        //     sender,
        //     signer::address_of(sender),
        //     100000,
        // );
    }
}
