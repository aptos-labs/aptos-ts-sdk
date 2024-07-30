Feature: Binary Canonical Serialization(BCS) Serialization

"""
  TODO List:
  * Add a struct for testing
  * Add some more test cases for each
  * Add struct sequence tests
  * Add for custom error handling on structs?
  * Do we add a fixed length test that doesn't match length of input (disallowed in Go entirely)
  """

  # TODO Do we merge all of the primitives into one big scenario outline?

  Scenario Outline: It must be able to serialize <label> as an address
    Given address <value>
    When I serialize as address
    Then the result should be bytes <bytes>

    Examples:
      | label                         | value                                                              | bytes                                                              |
      | address zero                  | 0x0                                                                | 0x0000000000000000000000000000000000000000000000000000000000000000 |
      | address one                   | 0x1                                                                | 0x0000000000000000000000000000000000000000000000000000000000000001 |
      | an address with leading zeros | 0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF  | 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF |
      | a full address                | 0xA123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF | 0xA123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF |

  Scenario Outline: It must be able to serialize <value> as a bool
    Given bool <value>
    When I serialize as bool
    Then the result should be bytes <bytes>

    Examples:
      | value | bytes |
      | false | 0x00  |
      | true  | 0x01  |

  Scenario Outline: It must be able to serialize <label> as an u8
    Given u8 <value>
    When I serialize as u8
    Then the result should be bytes <bytes>

    Examples:
      | label                    | value | bytes |
      | zero                     | 0     | 0x00  |
      | one                      | 1     | 0x01  |
      | the highest value (0xFF) | 255   | 0xFF  |

  Scenario Outline: It must be able to serialize <label> as an u16
    Given u16 <value>
    When I serialize as u16
    Then the result should be bytes <bytes>

    Examples:
      | label                      | value | bytes  |
      | zero                       | 0     | 0x0000 |
      | one                        | 1     | 0x0100 |
      | 0xFF                       | 255   | 0xFF00 |
      | 0x100                      | 256   | 0x0001 |
      | the highest value (0xFFFF) | 65535 | 0xFFFF |

  Scenario Outline: It must be able to serialize <label> as an u32
    Given u32 <value>
    When I serialize as u32
    Then the result should be bytes <bytes>

    Examples:
      | label                          | value      | bytes      |
      | zero                           | 0          | 0x00000000 |
      | one                            | 1          | 0x01000000 |
      | 0xFF                           | 255        | 0xFF000000 |
      | 0x100                          | 256        | 0x00010000 |
      | 0xFFFF                         | 65535      | 0xFFFF0000 |
      | 0x100000                       | 65536      | 0x00000100 |
      | 0xFFFFFF                       | 16777215   | 0xFFFFFF00 |
      | 0x1000000                      | 16777216   | 0x00000001 |
      | the highest value (0xFFFFFFFF) | 4294967295 | 0xFFFFFFFF |

  Scenario Outline: It must be able to serialize <label> as an u64
    Given u64 <value>
    When I serialize as u64
    Then the result should be bytes <bytes>

    Examples:
      | label                                 | value                | bytes              |
      | zero                                  | 0                    | 0x0000000000000000 |
      | one                                   | 1                    | 0x0100000000000000 |
      | 0xFF                                  | 255                  | 0xFF00000000000000 |
      | 0x100                                 | 256                  | 0x0001000000000000 |
      | 0xFFFF                                | 65535                | 0xFFFF000000000000 |
      | 0x10000                               | 65536                | 0x0000010000000000 |
      | 0xFFFFFF                              | 16777215             | 0xFFFFFF0000000000 |
      | 0x1000000                             | 16777216             | 0x0000000100000000 |
      | 0xFFFFFFFF                            | 4294967295           | 0xFFFFFFFF00000000 |
      | 0x100000000                           | 4294967296           | 0x0000000001000000 |
      | the highest value(0xFFFFFFFFFFFFFFFF) | 18446744073709551615 | 0xFFFFFFFFFFFFFFFF |

  Scenario Outline: It must be able to serialize <label> as an u128
    Given u128 <value>
    When I serialize as u128
    Then the result should be bytes <bytes>

    # TODO Fill in more examples
    Examples:
      | label                                                  | value                                   | bytes                              |
      | zero                                                   | 0                                       | 0x00000000000000000000000000000000 |
      | one                                                    | 1                                       | 0x01000000000000000000000000000000 |
      | 0xFF                                                   | 255                                     | 0xFF000000000000000000000000000000 |
      | 0x100                                                  | 256                                     | 0x00010000000000000000000000000000 |
      | 0xFFFF                                                 | 65535                                   | 0xFFFF0000000000000000000000000000 |
      | 0x10000                                                | 65536                                   | 0x00000100000000000000000000000000 |
      | 0xFFFFFFFF                                             | 4294967295                              | 0xFFFFFFFF000000000000000000000000 |
      | 0x100000000                                            | 4294967296                              | 0x00000000010000000000000000000000 |
      | the highest value (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) | 340282366920938463463374607431768211455 | 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF |

  Scenario Outline: It must be able to serialize <label> as an u256
    Given u256 <value>
    When I serialize as u256
    Then the result should be bytes <bytes>

    # TODO Fill in more examples
    Examples:
      | label                                                                                  | value                                                                          | bytes                                                              |
      | zero                                                                                   | 0                                                                              | 0x0000000000000000000000000000000000000000000000000000000000000000 |
      | one                                                                                    | 1                                                                              | 0x0100000000000000000000000000000000000000000000000000000000000000 |
      | 0xFF                                                                                   | 255                                                                            | 0xFF00000000000000000000000000000000000000000000000000000000000000 |
      | 0x1000                                                                                 | 256                                                                            | 0x0001000000000000000000000000000000000000000000000000000000000000 |
      | the highest value (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) | 115792089237316195423570985008687907853269984665640564039457584007913129639935 | 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF |

  Scenario Outline: It must be able to serialize <label> as an uleb128
    Given u32 <value>
    When I serialize as uleb128
    Then the result should be bytes <bytes>

    # TODO Fill in more examples
    Examples:
      | label                      | value      | bytes        |
      | zero                       | 0          | 0x00         |
      | one                        | 1          | 0x01         |
      | largest single byte (127)  | 127        | 0x7F         |
      | smallest double byte (128) | 128        | 0x8001       |
      | other double byte (240)    | 240        | 0xF001       |
      | 255                        | 255        | 0xFF01       |
      | three bytes (65535)        | 65535      | 0xFFFF03     |
      | four bytes (16777215)      | 16777215   | 0xFFFFFF07   |
      | max u32 (4294966295)       | 4294967295 | 0xFFFFFFFF0F |


  Scenario Outline: It must be able to serialize <label> as fixed bytes
    Given bytes <value>
    When I serialize as fixed bytes with length <length>
    Then the result should be bytes <bytes>

    Examples:
      | label            | value  | bytes  | length |
      | zero single byte | 0x00   | 0x00   | 1      |
      | single byte      | 0x7F   | 0x7F   | 1      |
      | two bytes        | 0x0102 | 0x0102 | 2      |

  Scenario Outline: It must be able to serialize <label> as bytes
    Given bytes <value>
    When I serialize as bytes
    Then the result should be bytes <bytes>

    Examples:
      | label                                             | value                                                                                                                                                                                                                                                              | bytes                                                                                                                                                                                                                                                                  |
      | zero byte                                         | 0x00                                                                                                                                                                                                                                                               | 0x0100                                                                                                                                                                                                                                                                 |
      | single byte                                       | 0x7F                                                                                                                                                                                                                                                               | 0x017F                                                                                                                                                                                                                                                                 |
      | two bytes                                         | 0x0102                                                                                                                                                                                                                                                             | 0x020102                                                                                                                                                                                                                                                               |
      | long bytes with one length byte (127 characters)  | 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCD   | 0x7F0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCD     |
      | long bytes with two length bytes (128 characters) | 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF | 0x80010123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF |

  Scenario Outline: It must be able to serialize <label> as a string
    Given string <value>
    When I serialize as string
    Then the result should be bytes <bytes>

    Examples:
      | label                  | value      | bytes                |
      | empty string           | ""         | 0x00                 |
      | uppercase A            | "A"        | 0x0141               |
      | lowercase a            | "a"        | 0x0161               |
      | three character string | "abc"      | 0x03616263           |
      | four character string  | "abcd"     | 0x0461626364         |
      | numbers and letters    | "1234abcd" | 0x083132333461626364 |
      | emojis                 | "😀🚀"     | 0x08F09F9880F09F9A80 |


  Scenario Outline: It must be able to serialize <label> as a sequence of <type>
    Given sequence of <type> <value>
    When I serialize as sequence of <type>
    Then the result should be bytes <bytes>

    Examples:
      | label          | type    | value        | bytes                                                                                                                                |
      | no bool        | bool    | []           | 0x00                                                                                                                                 |
      | single bool    | bool    | [true]       | 0x0101                                                                                                                               |
      | double bool    | bool    | [false,true] | 0x020001                                                                                                                             |
      | no u8          | u8      | []           | 0x00                                                                                                                                 |
      | single u8      | u8      | [0]          | 0x0100                                                                                                                               |
      | double u8      | u8      | [1,3]        | 0x020103                                                                                                                             |
      | no u16         | u16     | []           | 0x00                                                                                                                                 |
      | single u16     | u16     | [0]          | 0x010000                                                                                                                             |
      | double u16     | u16     | [1,3]        | 0x0201000300                                                                                                                         |
      | no u32         | u32     | []           | 0x00                                                                                                                                 |
      | single u32     | u32     | [0]          | 0x0100000000                                                                                                                         |
      | double u32     | u32     | [1,3]        | 0x020100000003000000                                                                                                                 |
      | no u64         | u64     | []           | 0x00                                                                                                                                 |
      | single u64     | u64     | [0]          | 0x010000000000000000                                                                                                                 |
      | double u64     | u64     | [1,3]        | 0x0201000000000000000300000000000000                                                                                                 |
      | no u128        | u128    | []           | 0x00                                                                                                                                 |
      | single u128    | u128    | [0]          | 0x0100000000000000000000000000000000                                                                                                 |
      | double u128    | u128    | [1,3]        | 0x020100000000000000000000000000000003000000000000000000000000000000                                                                 |
      | no u256        | u256    | []           | 0x00                                                                                                                                 |
      | single u256    | u256    | [0]          | 0x010000000000000000000000000000000000000000000000000000000000000000                                                                 |
      | double u256    | u256    | [1,3]        | 0x0201000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000 |
      | no uleb128     | uleb128 | []           | 0x00                                                                                                                                 |
      | single uleb128 | uleb128 | [0]          | 0x0100                                                                                                                               |
      | double uleb128 | uleb128 | [128,127]    | 0x0280017F                                                                                                                           |
      | no address     | address | []           | 0x00                                                                                                                                 |
      | single address | address | [0x1]        | 0x010000000000000000000000000000000000000000000000000000000000000001                                                                 |
      | double address | address | [0x2,0x0]    | 0x0200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000 |
      | no string      | string  | []           | 0x00                                                                                                                                 |
      | single string  | string  | ["😀🚀"]     | 0x0108F09F9880F09F9A80                                                                                                               |
      | double string  | string  | ["a","b"]    | 0x0201610162                                                                                                                         |
