script {
    use cedra_framework::coin;
    use cedra_framework::object;
    use cedra_std::signer;


    // Transfers an object for a price back in one transaction without escrow
    fun transfer<Coin>(
        sender: &signer,
        purchaser: &signer,
        object_address: address,
        amount: u64,
    ) {
        coin::transfer<Coin>(purchaser, signer::address_of(sender), amount);
        let object = object::address_to_object<object::ObjectCore>(object_address);
        object::transfer(sender, object, signer::address_of(purchaser));
    }
}
