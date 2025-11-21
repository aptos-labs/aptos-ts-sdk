import { defineBcsStruct } from '@aptos-labs/bcs';
import type { Serializer, WithSerializable } from '@aptos-labs/bcs';
import type { Deserializer } from '@aptos-labs/bcs';
import { HexInput, hexInputToUint8Array } from '@aptos-labs/utils';

type AccountAddressData = {
  bytes: Uint8Array
}

export type AccountAddress = WithSerializable<AccountAddressData>
export const AccountAddress = defineBcsStruct({
  create(hex_input: HexInput) {
    const bytes = hexInputToUint8Array(hex_input)
    return {
      bytes,
      serialize(s: Serializer) {
        s.serializeFixedBytes(bytes)
      }
    }
  },
  deserialize(d: Deserializer) {
    const bytes = d.deserializeFixedBytes(32)
    return {
      bytes,
      serialize(s: Serializer) {
        s.serializeFixedBytes(bytes)
      }
    }
  }
})