import { Serializable, Serializer } from "../../bcs";

export class ProofChallenge extends Serializable {
  public readonly data: Serializable[];

  constructor(data: Serializable[]) {
    super();
    this.data = data;
  }

  serialize(serializer: Serializer): void {
    this.data.forEach((data) => {
      serializer.serialize(data);
    });
  }
}
