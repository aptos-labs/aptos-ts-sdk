script {
    use aptos_framework::coin;
    use aptos_std::signer;


    // Transfers a coin with an receiver verifying the transfer
    fun transfer<Coin>(
        sender: &signer,
        receiver: &signer,
        amount: u64,
    ) {
        coin::transfer<Coin>(sender, signer::address_of(receiver), amount);
    }
}
