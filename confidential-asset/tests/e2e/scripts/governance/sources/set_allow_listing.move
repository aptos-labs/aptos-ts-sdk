script {
    use aptos_framework::aptos_governance;
    use aptos_framework::confidential_asset;

    fun set_allow_listing(core_resources: &signer, enabled: bool) {
        let framework_signer = aptos_governance::get_signer_testnet_only(core_resources, @0x1);
        confidential_asset::set_allow_listing(&framework_signer, enabled);
    }
}
