Feature: Binary Canonical Serialization(BCS) Deserialization

"""
  TODO List:
    * Add a struct for testing
    * Add possible invalid input number scenarios?  It's really language specific though
    * Add invalid UTF-8 string deserialization
    * Add invalid sequence item deserialization
    * Add invalid struct deserialization
    * Add invalid custom error struct deserialization
"""

  Scenario Outline: It must be able to deserialize <label> as an address
    Given bytes <bytes>
    When I deserialize as address
    Then the result should be address <value>

    Examples:
      | label                         | value                                                              | bytes                                                              |
      | address zero                  | 0x0                                                                | 0x0000000000000000000000000000000000000000000000000000000000000000 |
      | address one                   | 0x1                                                                | 0x0000000000000000000000000000000000000000000000000000000000000001 |
      | an address with leading zeros | 0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF  | 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF |
      | a full address                | 0xA123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF | 0xA123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF |

  Scenario Outline: It must be able to deserialize <value> as a bool
    Given bytes <bytes>
    When I deserialize as bool
    Then the result should be bool <value>

    Examples:
      | value | bytes |
      | false | 0x00  |
      | true  | 0x01  |

  Scenario Outline: It must not succeed if the bool type is not 0x00 or 0x01
    Given bytes <bytes>
    When I deserialize as bool
    Then the deserialization should fail

    Examples:
      | bytes |
      | 0x02  |
      | 0xFF  |

  Scenario Outline: It must be able to deserialize <label> as an u8
    Given bytes <bytes>
    When I deserialize as u8
    Then the result should be u8 <value>

    Examples:
      | label                    | value | bytes |
      | zero                     | 0     | 0x00  |
      | one                      | 1     | 0x01  |
      | the highest value (0xFF) | 255   | 0xFF  |

  Scenario Outline: It must be able to deserialize <label> as an u16
    Given bytes <bytes>
    When I deserialize as u16
    Then the result should be u16 <value>

    Examples:
      | label                      | value | bytes  |
      | zero                       | 0     | 0x0000 |
      | one                        | 1     | 0x0100 |
      | 0xFF                       | 255   | 0xFF00 |
      | 0x100                      | 256   | 0x0001 |
      | the highest value (0xFFFF) | 65535 | 0xFFFF |

  Scenario Outline: It must be able to deserialize <label> as an u32
    Given bytes <bytes>
    When I deserialize as u32
    Then the result should be u32 <value>

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

  Scenario Outline: It must be able to deserialize <label> as an u64
    Given bytes <bytes>
    When I deserialize as u64
    Then the result should be u64 <value>

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

  Scenario Outline: It must be able to deserialize <label> as an u128
    Given bytes <bytes>
    When I deserialize as u128
    Then the result should be u128 <value>

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

  Scenario Outline: It must be able to deserialize <label> as an u256
    Given bytes <bytes>
    When I deserialize as u256
    Then the result should be u256 <value>

    Examples:
      | label                                                                                  | value                                                                          | bytes                                                              |
      | zero                                                                                   | 0                                                                              | 0x0000000000000000000000000000000000000000000000000000000000000000 |
      | one                                                                                    | 1                                                                              | 0x0100000000000000000000000000000000000000000000000000000000000000 |
      | 0xFF                                                                                   | 255                                                                            | 0xFF00000000000000000000000000000000000000000000000000000000000000 |
      | 0x1000                                                                                 | 256                                                                            | 0x0001000000000000000000000000000000000000000000000000000000000000 |
      | the highest value (0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF) | 115792089237316195423570985008687907853269984665640564039457584007913129639935 | 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF |


  Scenario Outline: It must be able to deserialize <label> as an uleb128
    Given bytes <bytes>
    When I deserialize as uleb128
    Then the result should be u32 <value>

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

  Scenario Outline: It must not succeed if the uleb128 type is not a valid uleb128 <label>
    Given bytes <bytes>
    When I deserialize as uleb128
    Then the deserialization should fail

    Examples:
      | label             | bytes        |
      | Missing next byte | 0x80         |
      | Too large         | 0xFFFFFFFF10 |

  Scenario Outline: It must be able to deserialize <label> as fixed bytes with length <length>
    Given bytes <bytes>
    When I deserialize as fixed bytes with length <length>
    Then the result should be bytes <value>

    Examples:
      | label             | value  | bytes  | length |
      | zero length fixed | 0x     | 0x     | 0      |
      | zero single byte  | 0x00   | 0x00   | 1      |
      | single byte       | 0x7F   | 0x7F   | 1      |
      | two bytes         | 0x0102 | 0x0102 | 2      |

  Scenario: It must not succeed deserializing fixed bytes, if the input is too short
    Given bytes 0x00
    When I deserialize as fixed bytes with length 2
    Then the deserialization should fail

  Scenario Outline: It must be able to deserialize <label> as bytes
    Given bytes <bytes>
    When I deserialize as bytes
    Then the result should be bytes <value>

    Examples:
      | label                                             | value                                                                                                                                                                                                                                                              | bytes                                                                                                                                                                                                                                                                  |
      | zero byte                                         | 0x00                                                                                                                                                                                                                                                               | 0x0100                                                                                                                                                                                                                                                                 |
      | single byte                                       | 0x7F                                                                                                                                                                                                                                                               | 0x017F                                                                                                                                                                                                                                                                 |
      | two bytes                                         | 0x0102                                                                                                                                                                                                                                                             | 0x020102                                                                                                                                                                                                                                                               |
      | long bytes with one length byte (127 characters)  | 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCD   | 0x7F0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCD     |
      | long bytes with two length bytes (128 characters) | 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF | 0x80010123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF |


  Scenario Outline: It must be able to deserialize <label> as a string <value> from <bytes>
    Given bytes <bytes>
    When I deserialize as string
    Then the result should be string <value>

    Examples:
      | label                  | value      | bytes                |
      | empty string           | ""         | 0x00                 |
      | uppercase A            | "A"        | 0x0141               |
      | lowercase a            | "a"        | 0x0161               |
      | three character string | "abc"      | 0x03616263           |
      | four character string  | "abcd"     | 0x0461626364         |
      | numbers and letters    | "1234abcd" | 0x083132333461626364 |
      | emojis                 | "😀🚀"     | 0x08F09F9880F09F9A80 |

  Scenario Outline: It must be able to deserialize <label> as a sequence of <type>
    Given bytes <bytes>
    When I deserialize as sequence of <type>
    Then the result should be sequence of <type> <value>

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

  Scenario Outline: It must not succeed if there are not enough bytes to deserialize <label>
    Given bytes <bytes>
    When I deserialize as <type>
    Then the deserialization should fail

    Examples:
      | label                            | type    | bytes                                                            |
      | bool                             | bool    | 0x                                                               |
      | u8                               | u8      | 0x                                                               |
      | u16                              | u16     | 0x00                                                             |
      | u32                              | u32     | 0x000000                                                         |
      | u64                              | u64     | 0x00000000000000                                                 |
      | u128                             | u128    | 0x000000000000000000000000000000                                 |
      | u256                             | u256    | 0x00000000000000000000000000000000000000000000000000000000000000 |
      | address                          | address | 0x00000000000000000000000000000000000000000000000000000000000000 |
      | short address                    | address | 0x01                                                              |
      | bytes without length             | bytes   | 0x                                                               |
      | bytes with length and no values  | bytes   | 0x01                                                             |
      | string without length            | string  | 0x                                                               |
      | string with length and no values | string  | 0x01                                                             |
    # TODO check similar for sequences
