/// A module that enables the creation and management of secondary fungible asset stores.
/// This module allows users to create additional stores for their fungible assets beyond the primary store,
/// enabling more complex asset management scenarios. Users can create multiple secondary stores for different
/// fungible assets, and the module maintains a mapping of these stores for each user.
module FACoin::secondary_store {
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleStore};
    use aptos_framework::object::{Self, Object};
    use aptos_std::table;
    use std::error;
    use std::signer;
    use aptos_framework::event;

    /// Error codes
    /// Error when attempting to create a secondary store that already exists
    const ESTORE_ALREADY_EXISTS: u64 = 1;
    /// Error when trying to access secondary stores for a user that hasn't initialized them
    const EUSER_SECONDARY_STORES_DOES_NOT_EXIST: u64 = 2;
    /// Error when trying to access a non-existent secondary store
    const ESTORE_DOES_NOT_EXIST: u64 = 3;

    /// A mapping from metadata_address to secondary store address for a specific user.
    /// This struct maintains a table of all secondary stores owned by a user, indexed by the metadata address
    /// of the fungible asset they correspond to.
    struct UserSecondaryStores has key {
        stores: table::Table<address, Object<FungibleStore>>
    }

    #[event]
    struct SecondaryStoreCreated has store, drop {
        user: address,
        metadata: address,
        secondary_store: Object<FungibleStore>
    }

    /// Create a secondary store for a specific fungible asset
    public entry fun create_secondary_store(
        user: &signer, metadata: Object<Metadata>
    ) acquires UserSecondaryStores {
        let user_addr = signer::address_of(user);
        let metadata_addr = object::object_address(&metadata);

        // Initialize UserSecondaryStores if it doesn't exist
        if (!exists<UserSecondaryStores>(user_addr)) {
            move_to(user, UserSecondaryStores { stores: table::new() });
        };

        let stores = &mut borrow_global_mut<UserSecondaryStores>(user_addr).stores;

        // Check if store already exists
        assert!(
            !table::contains(stores, metadata_addr),
            error::already_exists(ESTORE_ALREADY_EXISTS)
        );

        // Create the secondary store
        let constructor_ref = &object::create_named_object(user, b"SECONDARY");
        let store = fungible_asset::create_store(constructor_ref, metadata);

        // Store the mapping
        table::add(stores, metadata_addr, store);

        event::emit(
            SecondaryStoreCreated {
                user: user_addr,
                metadata: metadata_addr,
                secondary_store: store
            }
        );
    }

    #[view]
    /// View function to get the secondary store address for a user and metadata combination
    public fun get_secondary_store(
        user_addr: address, metadata: Object<Metadata>
    ): Object<FungibleStore> acquires UserSecondaryStores {
        let metadata_addr = object::object_address(&metadata);
        assert!(
            exists<UserSecondaryStores>(user_addr),
            EUSER_SECONDARY_STORES_DOES_NOT_EXIST
        );

        let stores = &borrow_global<UserSecondaryStores>(user_addr).stores;
        assert!(table::contains(stores, metadata_addr), ESTORE_DOES_NOT_EXIST);

        return *table::borrow(stores, metadata_addr)
    }

    #[test(creator = @FACoin)]
    fun test_secondary_store_creation(creator: &signer) acquires UserSecondaryStores {
        let creator_addr = signer::address_of(creator);

        // Create a test metadata object
        let constructor_ref = &object::create_named_object(creator, b"TEST");
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),
            utf8(b"Test Asset"),
            utf8(b"TEST"),
            8,
            utf8(b"http://example.com/icon"),
            utf8(b"http://example.com")
        );
        let metadata_object_signer = object::generate_signer(constructor_ref);

        let metadata =
            object::address_to_object<Metadata>(
                signer::address_of(&metadata_object_signer)
            );

        // Create secondary store
        create_secondary_store(creator, metadata);

        // Verify store exists
        get_secondary_store(creator_addr, metadata);
    }
}
