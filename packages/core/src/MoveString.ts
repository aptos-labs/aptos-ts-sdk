import { defineBcsStruct, Deserializer, Serializer, WithSerializable } from '@aptos-labs/bcs';

type MoveStringData = {
    value: string
}

export type MoveString = WithSerializable<MoveStringData>
export const MoveString = defineBcsStruct({
    create(value: string) {
        return {
            value,
            serialize(s: Serializer) {
                s.serializeStr(value)
            }
        }
    },
    deserialize(d: Deserializer) {
        const value = d.deserializeStr()
        return {
            value,
            serialize(s: Serializer) {
                s.serializeStr(value)
            }
        }   
    }
})

