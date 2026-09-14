script {
    use aptos_framework::aptos_governance;
    use aptos_framework::confidential_asset;

    /// Pauses or unpauses all user operations in the confidential asset module.
    fun set_emergency_paused(core_resources: &signer, paused: bool) {
        let framework_signer = aptos_governance::get_signer_testnet_only(core_resources, @0x1);
        confidential_asset::set_emergency_paused(&framework_signer, paused);
    }
}
