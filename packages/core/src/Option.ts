import { defineBcsStruct, Deserializer, Deserializable, Serializer, WithSerializable, Serializable } from '@aptos-labs/bcs';

type OptionData<T> = {
    value: T | undefined
}

export type Option<T> = WithSerializable<OptionData<T>>

type OptionType<T> = Deserializable<T>

export function Option<T extends Serializable>(
    type: OptionType<T>,
) {
    return defineBcsStruct<OptionData<T>, (value?: T) => OptionData<T> & Serializable>({
        create(value?: T) {
            return {
                value,
                serialize(s: Serializer) {
                    s.serializeOption(value)
                }
            }
        },
        deserialize(d: Deserializer) {
            let value: T | undefined
            value = d.deserializeOption(type)
            return {
                value,
                serialize(s: Serializer) {
                    s.serializeOption(value)
                }
            }   
        }
    })
}

