script {
    use cedra_framework::coin::{Self};
    use cedra_framework::transaction_validation::{Self};
    use cedra_framework::primary_fungible_store::{Self};
    use cedra_framework::permissioned_delegation::{Self};
    use cedra_std::ed25519;
    use std::option;

    fun main(sender: &signer, sender_public_key: vector<u8>) {
        coin::migrate_to_fungible_store<cedra_framework::cedra_coin::CedraCoin>(sender);
        let key = permissioned_delegation::gen_ed25519_key(ed25519::new_unvalidated_public_key_from_bytes(sender_public_key));
        let permissioned_signer = permissioned_delegation::add_permissioned_handle(sender, key, option::none(), 10000000000000);
        primary_fungible_store::grant_apt_permission(sender, &permissioned_signer, 100000000); 
        transaction_validation::grant_gas_permission(sender, &permissioned_signer, 100000000);
    }
}
