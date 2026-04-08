script {
    use aptos_framework::aptos_governance;
    use aptos_framework::confidential_asset;

    fun set_confidentiality_for_apt(core_resources: &signer, allowed: bool) {
        let framework_signer = aptos_governance::get_signer_testnet_only(core_resources, @0x1);
        confidential_asset::set_confidentiality_for_apt(&framework_signer, allowed);
    }
}
