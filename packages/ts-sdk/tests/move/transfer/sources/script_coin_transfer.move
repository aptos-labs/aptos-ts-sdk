script {
    use aptos_framework::coin;

    fun coin_transfer<Coin>(
        sender: &signer,
        amount: u64,
        reciever: address,
    ) {
        let coin = coin::withdraw<Coin>(sender, amount);
        coin::deposit(reciever, coin);
    }
}
