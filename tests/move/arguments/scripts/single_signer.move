script {
    use std::signer;
    use std::object::{Object};
    use std::string::{String};
    use transaction_arguments::tx_args_module::{Self, EmptyResource};

    fun main(
        account_1: &signer,
        address_1: address,
        arg_bool: bool,
        arg_u8: u8,
        arg_u16: u16,
        arg_u32: u32,
        arg_u64: u64,
        arg_u128: u128,
        arg_u256: u256,
        arg_address: address,
        arg_string: String,
        arg_object: Object<EmptyResource>,
        vector_u8: vector<u8>,
    ) {
        assert!(signer::address_of(account_1) == address_1, 100);
        tx_args_module::assert_values_for_script(
            arg_bool,
            arg_u8,
            arg_u16,
            arg_u32,
            arg_u64,
            arg_u128,
            arg_u256,
            arg_address,
            arg_string,
            arg_object,
            vector_u8,
        );
    }
}
