module my_addr::claims {
    use std::error;
    use aptos_std::ed25519;
    use aptos_std::signer;
    use aptos_std::smart_table;
    use aptos_std::smart_table::SmartTable;
    use aptos_framework::account;
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin;
    use aptos_framework::coin;
    use aptos_framework::coin::Coin;

    struct Claim has drop {
        sender: address,
        receiver: address,
        claim_number: u64,
    }

    struct Claims has key {
        escrows: SmartTable<u64, Coin<aptos_coin::AptosCoin>>,
        next: u64,
    }

    /// Public key bytes don't match caller's authentication key
    const E_PUBLIC_KEY_NOT_SIGNER: u64 = 1;
    /// Invalid signature
    const E_INVALID_SIGNATURE: u64 = 2;
    /// Not enough coins to transfer
    const E_NOT_ENOUGH_COINS: u64 = 3;
    /// Claim doesn't exist
    const E_NO_CLAIM: u64 = 4;

    /// Creates a claim, to be claimed by a signature from others
    entry fun create_claim(caller: &signer, amount: u64) acquires Claims {
        let caller_address = signer::address_of(caller);
        if (!exists<Claims>(caller_address)) {
            move_to(caller, Claims {
                escrows: smart_table::new(),
                next: 0,
            })
        };

        assert!(coin::balance<aptos_coin::AptosCoin>(caller_address) >= amount, E_NOT_ENOUGH_COINS);

        // Add a claim to be claimed later
        let claims = borrow_global_mut<Claims>(caller_address);
        smart_table::add(&mut claims.escrows, claims.next, coin::withdraw(caller, amount));
        claims.next = claims.next + 1;
    }

    /// Claims based on a signed message from a user
    ///
    /// Note: Only supports ED25519 keys
    entry fun claim(
        receiver: &signer,
        sender: address,
        claim_number: u64,
        sender_public_key_bytes: vector<u8>,
        signature_bytes: vector<u8>
    ) acquires Claims {
        let receiver_address = signer::address_of(receiver);

        // Check that the claim exists
        assert!(exists<Claims>(sender), E_NO_CLAIM);
        let claims = borrow_global<Claims>(sender);
        assert!(smart_table::contains(&claims.escrows, claim_number), E_NO_CLAIM);

        // Verify that the public key bytes, match the onchcain authentication key
        let public_key = ed25519::new_unvalidated_public_key_from_bytes(sender_public_key_bytes);
        let authentication_key = ed25519::unvalidated_public_key_to_authentication_key(&public_key);
        let sender_auth_key = account::get_authentication_key(sender);
        assert!(sender_auth_key == authentication_key, error::unauthenticated(E_PUBLIC_KEY_NOT_SIGNER));

        // Verify signature
        let to_check = Claim {
            sender,
            receiver: receiver_address,
            claim_number,
        };
        let signature = ed25519::new_signature_from_bytes(signature_bytes);
        assert!(
            ed25519::signature_verify_strict_t(&signature, &public_key, to_check),
            std::error::invalid_argument(E_INVALID_SIGNATURE)
        );

        // Once verified transfer amount to user
        let claims = borrow_global_mut<Claims>(sender);
        let coins = smart_table::remove(&mut claims.escrows, claim_number);
        aptos_account::deposit_coins(receiver_address, coins);
    }
}
