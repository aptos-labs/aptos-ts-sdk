import { Deserializer } from "./deserializer"
import { Serializable, SerializableMixins, WithSerializable } from "./serializer"

export function defineBcsStruct<
  T extends object,
  C extends (...args: any[]) => T & Serializable
>(fns: {
  create: C
  deserialize: (d: Deserializer) => ReturnType<C>
}) {
  type Instance = WithSerializable<T>
  const wrap = (base: T & Serializable): Instance =>
    Object.assign({} as Instance, base, SerializableMixins)

  return {
    create(...args: Parameters<C>): Instance {
      return wrap(fns.create(...args))
    },
    deserialize(d: Deserializer): Instance {
      return wrap(fns.deserialize(d))
    },
    fromBytes(bytes: Uint8Array): Instance {
      const d = new Deserializer(bytes)
      return this.deserialize(d)
    }
  }
}