script {
    use aptos_framework::jwks;
    use std::string::{String,utf8};
    use std::vector;
    fun main(account: &signer, iss: vector<u8>, kid: String, alg: String, e: String, n: String) {
        let patch_0 = jwks::new_patch_remove_all();
        // let iss = b"https://dev-qtdgjv22jh0v1k7g.us.auth0.com/";
        let jwk = jwks::new_rsa_jwk(kid, alg, e, n);
        let patch_1 = jwks::new_patch_upsert_jwk(iss, jwk);
        let patches = vector[patch_0, patch_1]; // clear all, then add 1 jwk.
        jwks::patch_federated_jwks(account, patches);
    }
}