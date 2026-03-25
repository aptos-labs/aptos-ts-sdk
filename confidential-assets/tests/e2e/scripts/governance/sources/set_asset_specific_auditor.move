script {
    use std::option;
    use aptos_framework::aptos_governance;
    use aptos_framework::confidential_asset;
    use aptos_framework::fungible_asset;
    use aptos_framework::object;

    /// Sets or removes an asset-specific auditor. Pass empty vector for auditor_ek to remove.
    fun set_asset_specific_auditor(core_resources: &signer, asset_type_addr: address, auditor_ek: vector<u8>) {
        let framework_signer = aptos_governance::get_signer_testnet_only(core_resources, @0x1);
        let asset_type = object::address_to_object<fungible_asset::Metadata>(asset_type_addr);
        let ek_opt = if (auditor_ek.length() == 0) {
            option::none()
        } else {
            option::some(auditor_ek)
        };
        confidential_asset::set_asset_specific_auditor(&framework_signer, asset_type, ek_opt);
    }
}
