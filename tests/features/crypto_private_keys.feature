Feature: Cryptographic Private Keys
"""
Cryptographic private keys are keys that use asymmetric cryptography to sign and verify messages.

This specifications covers the following:
* Specifications for Ed25519 and Secp256k1 private keys.
* AIP-80 compliant formatting and parsing of bytes, hex strings, and AIP-80 compliant strings. Read about AIP-80 here: https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-80.md
"""

  Scenario Outline: It must format a HexString to an AIP-80 compliant string
    Given key <key> hexstring <value>
    When I format to aip-80
    Then the result should be aip80_string <formatted>

    Examples:
      | key       | value                                                              | formatted                                                                         |
      | ed25519   | 0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5 | ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5   |
      | secp256k1 | 0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e | secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e |

  Scenario Outline: It must accept a HexString and derive the private key
    Given key <key> hexstring <value>
    When I derive the private key
    Then the result should be aip80_string <formatted>

    Examples:
      | key       | value                                                              | formatted                                                                         |
      | ed25519   | 0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5 | ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5   |
      | secp256k1 | 0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e | secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e |

  Scenario Outline: It must accept bytes and derive the private key
    Given key <key> bytes <value>
    When I derive the private key
    Then the result should be aip80_string <formatted>

    Examples:
      | key       | value                                                            | formatted                                                                         |
      | ed25519   | c5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5 | ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5   |
      | secp256k1 | d107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e | secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e |

  Scenario Outline: It must accept AIP-80 compliant strings and derive the private key
    Given key <key> aip80_string <value>
    When I derive the private key
    Then the result should be aip80_string <formatted>

    Examples:
      | key       | value                                                                             | formatted                                                                         |
      | ed25519   | ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5   | ed25519-priv-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5   |
      | secp256k1 | secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e | secp256k1-priv-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e |

  Scenario Outline: It should throw when an invalid AIP-80 string is provided
    Given key <key> aip80_string <value>
    When I derive the private key
    Then it should throw

    Examples:
      | key       | value                                                                            |
      | ed25519   | ed25519-priv-0xINVALIDHEX                                                        |
      | ed25519   | INVALIDPREFIX-0xc5338cd251c22daa8c9c9cc94f498cc8a5c7e1d2e75287a5dda91096fe64efa5 |
      | secp256k1 | secp256k1-priv-0xINVALIDHEX                                                      |
      | secp256k1 | INVALIDPREFIX-0xd107155adf816a0a94c6db3c9489c13ad8a1eda7ada2e558ba3bfa47c020347e |
