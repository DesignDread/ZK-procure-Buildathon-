let eddsa: any = null;
let poseidon: any = null;

async function initCircomlib() {
  if (!eddsa || !poseidon) {
    const circomlib = require('circomlibjs');
    eddsa = await circomlib.buildEddsa();
    poseidon = await circomlib.buildPoseidon();
  }
}

export interface SignedCredential {
  R8: string[];
  S: string;
  pubKey: string[];
  supplierData: any;
}

export class MockFip {
  async generateKeyPair(): Promise<{ privateKey: Buffer, publicKey: string[] }> {
    await initCircomlib();
    const prvKey = Buffer.from('0001020304050607080900010203040506070809000102030405060708090001', 'hex');
    const pubKey = eddsa.prv2pub(prvKey);
    return {
      privateKey: prvKey,
      publicKey: [eddsa.F.toObject(pubKey[0]).toString(), eddsa.F.toObject(pubKey[1]).toString()]
    };
  }

  async issueCredential(privateKey: Buffer, supplierData: { workingCapitalPaise: number, gstNumber: string, companyId: string, timestamp: number }): Promise<SignedCredential> {
    await initCircomlib();
    const dataHash = poseidon([
      supplierData.workingCapitalPaise,
      BigInt('0x' + Buffer.from(supplierData.gstNumber).toString('hex')),
      BigInt('0x' + Buffer.from(supplierData.companyId).toString('hex')),
      supplierData.timestamp
    ]);
    const signature = eddsa.signPoseidon(privateKey, dataHash);
    const pubKey = eddsa.prv2pub(privateKey);
    return {
      R8: [eddsa.F.toObject(signature.R8[0]).toString(), eddsa.F.toObject(signature.R8[1]).toString()],
      S: signature.S.toString(),
      pubKey: [eddsa.F.toObject(pubKey[0]).toString(), eddsa.F.toObject(pubKey[1]).toString()],
      supplierData
    };
  }

  async verifyCredentialSignature(credential: SignedCredential): Promise<boolean> {
    await initCircomlib();
    const { supplierData, R8, S, pubKey } = credential;
    const dataHash = poseidon([
      supplierData.workingCapitalPaise,
      BigInt('0x' + Buffer.from(supplierData.gstNumber).toString('hex')),
      BigInt('0x' + Buffer.from(supplierData.companyId).toString('hex')),
      supplierData.timestamp
    ]);
    const signature = {
      R8: [eddsa.F.e(R8[0]), eddsa.F.e(R8[1])],
      S: BigInt(S)
    };
    const pubKeyDecoded = [eddsa.F.e(pubKey[0]), eddsa.F.e(pubKey[1])];
    return eddsa.verifyPoseidon(dataHash, signature, pubKeyDecoded);
  }
}
