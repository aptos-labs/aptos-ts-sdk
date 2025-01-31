script {
    use aptos_framework::coin::{Self};
    use aptos_framework::transaction_validation::{Self};
    use aptos_framework::primary_fungible_store::{Self};
    use aptos_framework::account_abstraction::{Self};
    use aptos_framework::permissioned_delegation::{Self};
    use aptos_std::ed25519;
    use std::string::utf8;
    use std::option;

    fun main(sender: &signer, sender_public_key: vector<u8>) {
        coin::migrate_to_fungible_store<aptos_framework::aptos_coin::AptosCoin>(sender);
        let key = permissioned_delegation::gen_ed25519_key(ed25519::new_unvalidated_public_key_from_bytes(sender_public_key));
        let permissioned_signer = permissioned_delegation::add_permissioned_handle(sender, key, option::none(), 10000000000000);
        primary_fungible_store::grant_apt_permission(sender, &permissioned_signer, 100000000); 
        transaction_validation::grant_gas_permission(sender, &permissioned_signer, 100000000);
        account_abstraction::add_dispatchable_authentication_function(sender, @aptos_framework, utf8(b"permissioned_delegation"), utf8(b"authenticate"));
    }
}
