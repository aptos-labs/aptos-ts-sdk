script {
    use cedra_framework::object;
    use cedra_std::signer;


    // Creates an object owned by the sender
    fun create_object(
        sender: &signer,
    ) {
        let _ = object::create_object(signer::address_of(sender));
    }
}
