// @ts-ignore
import * as snarkjs from "snarkjs";

export async function generateProof(
  input: any,
  wasmPath: string,
  zkeyPath: string
) {
  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );
    return { proof, publicSignals };
  } catch (error) {
    console.error("Error generating proof:", error);
    throw error;
  }
}
