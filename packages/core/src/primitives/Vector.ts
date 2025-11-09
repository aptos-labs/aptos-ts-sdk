import { defineBcsStruct, Deserializer, Deserializable, Serializer, WithSerializable, Serializable } from '@aptos-labs/bcs';

type VectorData<T> = {
    value: Array<T>
}

export type Vector<T> = WithSerializable<VectorData<T>>

export function Vector<T extends Serializable>(cls: Deserializable<T>) {
    return defineBcsStruct<VectorData<T>, (value: Array<T>) => VectorData<T> & Serializable>({
        create(value: Array<T>) {
            return {
                value,
                serialize(s: Serializer) {
                    s.serializeVector(value)
                }
            }
        },
        deserialize(d: Deserializer) {
            const value = d.deserializeVector(cls)
            return {
                value,
                serialize(s: Serializer) {
                    s.serializeVector(value)
                }
            }   
        }
    })
}

