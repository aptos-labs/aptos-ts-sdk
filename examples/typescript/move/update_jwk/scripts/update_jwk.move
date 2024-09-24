script {
    use aptos_framework::jwks;
    use std::string::String;
    use std::vector;
    fun main(account: &signer, iss: vector<u8>, kid_vec: vector<String>, alg_vec: vector<String>, e_vec: vector<String>, n_vec: vector<String>) {
        assert!(!vector::is_empty(&kid_vec), 0);
        let num_jwk = vector::length<String>(&kid_vec);
        assert!(vector::length(&alg_vec) == num_jwk , 0);
        assert!(vector::length(&e_vec) == num_jwk, 0);
        assert!(vector::length(&n_vec) == num_jwk, 0);

        let remove_all_patch = jwks::new_patch_remove_all();
        let patches = vector[remove_all_patch];
        while (!vector::is_empty(&kid_vec)) {
            let kid = vector::pop_back(&mut kid_vec);
            let alg = vector::pop_back(&mut alg_vec);
            let e = vector::pop_back(&mut e_vec);
            let n = vector::pop_back(&mut n_vec);
            let jwk = jwks::new_rsa_jwk(kid, alg, e, n);
            let patch = jwks::new_patch_upsert_jwk(iss, jwk);
            vector::push_back(&mut patches, patch)
        };
        jwks::patch_federated_jwks(account, patches);
    }
}