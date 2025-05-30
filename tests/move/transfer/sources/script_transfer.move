script {
  use cedra_framework::cedra_coin;
  use cedra_framework::coin;

  fun single_transfer(
    sender: &signer,
    amount: u64,
    reciever: address,
  ) {
    let coin = coin::withdraw<cedra_coin::CedraCoin>(sender, amount);
    coin::deposit(reciever, coin);
  }
}
