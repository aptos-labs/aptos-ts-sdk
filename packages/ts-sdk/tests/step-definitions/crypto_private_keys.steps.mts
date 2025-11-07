import { Given, Then, When } from "@cucumber/cucumber";
import { Ed25519PrivateKey, Hex, PrivateKey, PrivateKeyVariants, Secp256k1PrivateKey } from "../../dist/esm/index.mjs";
import assert from "assert";

/* eslint-disable func-names */

Given(
  /^key (ed25519|secp256k1) (hexstring|bytes|aip80_string) (.*)$/,
  function (keyType: string, valueType: string, value: string) {
    switch (keyType) {
      case "ed25519":
        this.keyType = PrivateKeyVariants.Ed25519;
        break;
      case "secp256k1":
        this.keyType = PrivateKeyVariants.Secp256k1;
        break;
      default:
        throw new Error(`Unsupported key type: ${keyType}`);
    }

    switch (valueType) {
      case "hexstring":
        this.inputType = "hexstring";
        this.input = value;
        break;
      case "bytes":
        this.inputType = "bytes";
        this.input = Hex.fromHexString(value).toUint8Array();
        break;
      case "aip80_string":
        this.inputType = "aip80_string";
        this.input = value;
        break;
      default:
        throw new Error(`Unsupported value type: ${valueType}`);
    }
  },
);

When(/^I derive the private key$/, function () {
  try {
    switch (this.keyType) {
      case PrivateKeyVariants.Ed25519:
        this.result = new Ed25519PrivateKey(this.input, false).toAIP80String();
        break;
      case PrivateKeyVariants.Secp256k1:
        this.result = new Secp256k1PrivateKey(this.input, false).toAIP80String();
        break;
      default:
        throw new Error(`Unsupported key type: ${this.keyType}`);
    }
  } catch (error) {
    this.error = error;
  }
});

When(/^I format to aip-80$/, function () {
  this.result = PrivateKey.formatPrivateKey(this.input, this.keyType);
});

Then(/^the result should be (aip80_string) (.*)$/, function (type: string, value: string) {
  if (this.error) throw this.error;
  switch (type) {
    case "aip80_string":
      assert.equal(this.result, value, `Expected ${value} to be ${this.result}`);
      break;
    default:
      throw new Error(`Unsupported result type: ${type}`);
  }
});

Then(/^it should throw$/, function () {
  assert(this.error !== undefined, "Expected an error to be thrown");
});
