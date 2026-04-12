script {
    use std::option;
    use aptos_framework::aptos_governance;
    use aptos_framework::confidential_asset;

    /// Sets or removes the global auditor. Pass empty vector to remove.
    fun set_global_auditor(core_resources: &signer, auditor_ek: vector<u8>) {
        let framework_signer = aptos_governance::get_signer_testnet_only(core_resources, @0x1);
        let ek_opt = if (auditor_ek.length() == 0) {
            option::none()
        } else {
            option::some(auditor_ek)
        };
        confidential_asset::set_global_auditor(&framework_signer, ek_opt);
    }
}
