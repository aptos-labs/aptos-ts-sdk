script {
  use aptos_framework::aptos_coin;
  use aptos_framework::coin;

  fun single_transfer(
    sender: &signer,
    amount: u64,
    reciever: address,
  ) {
    let coin = coin::withdraw<aptos_coin::AptosCoin>(sender, amount);
    coin::deposit(reciever, coin);
  }
}
