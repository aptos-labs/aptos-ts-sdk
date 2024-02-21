script {
  use aptos_framework::aptos_coin;
  use aptos_framework::coin;

  fun single_transfer(
    sender: &signer,
    amount: u64,
    receiver: address,
  ) {
    let coin = coin::withdraw<aptos_coin::AptosCoin>(sender, amount);
    coin::deposit(receiver, coin);
  }
}
