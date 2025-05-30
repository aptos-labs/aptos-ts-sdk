script {
    fun register(account: &signer) {
        cedra_framework::managed_coin::register<MoonCoin::moon_coin::MoonCoin>(account)
    }
}
