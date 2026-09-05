#!/usr/bin/env node

/**
 * ZK-Procure Prover CLI
 * 
 * Command-line interface for generating ZK proofs on the supplier's machine.
 * Private financial data NEVER leaves this process.
 * 
 * Usage:
 *   zk-prove generate --input ./input.json --wasm ./circuit.wasm --zkey ./circuit.zkey --output ./proof.json
 *   zk-prove verify --proof ./proof.json --vkey ./verification_key.json
 *   zk-prove mock --input ./input.json --output ./proof.json
 */

// @ts-nocheck
import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { generateProof, verifyProof, generateMockProof, parsePublicSignals } from './index.js';

const program = new Command();

program
  .name('zk-prove')
  .description('ZK-Procure: Privacy-preserving proof generation CLI')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate a Groth16 ZK proof (private inputs stay local)')
  .requiredOption('-i, --input <path>', 'Path to input JSON file')
  .requiredOption('-w, --wasm <path>', 'Path to compiled circuit WASM')
  .requiredOption('-z, --zkey <path>', 'Path to proving key (.zkey)')
  .option('-o, --output <path>', 'Output path for proof JSON', './proof_output.json')
  .action(async (opts) => {
    try {
      console.log('\n🔐 ZK-Procure Proof Generator');
      console.log('━'.repeat(50));
      
      if (!existsSync(opts.input)) {
        console.error(`Input file not found: ${opts.input}`);
        process.exit(1);
      }
      
      const inputs = JSON.parse(readFileSync(opts.input, 'utf-8'));
      
      console.log('\n📋 Public inputs:');
      console.log(`   Policy Hash: ${inputs.policyHash}`);
      console.log(`   Threshold: ₹${(parseInt(inputs.requiredThreshold) / 100).toLocaleString('en-IN')}`);
      console.log(`   Order Nonce: ${inputs.orderNonce}`);
      console.log(`   Identity Commitment: ${inputs.supplierIdentityCommitment?.substring(0, 20)}...`);
      console.log('\n🔒 Private inputs loaded (will NOT appear in output)');

      const result = await generateProof(inputs, opts.wasm, opts.zkey);
      
      writeFileSync(opts.output, JSON.stringify(result, null, 2));
      console.log(`\n📁 Proof written to: ${opts.output}`);
      console.log('✅ Done. Only the proof and public signals are in the output file.');
      console.log('   Your private financial data was used locally and discarded.');
    } catch (err) {
      console.error('❌ Proof generation failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify a Groth16 ZK proof')
  .requiredOption('-p, --proof <path>', 'Path to proof JSON file')
  .requiredOption('-v, --vkey <path>', 'Path to verification key JSON')
  .action(async (opts) => {
    try {
      console.log('\n🔍 ZK-Procure Proof Verifier');
      console.log('━'.repeat(50));
      
      const proofData = JSON.parse(readFileSync(opts.proof, 'utf-8'));
      const result = await verifyProof(proofData.proof, proofData.publicSignals, opts.vkey);
      
      const namedSignals = parsePublicSignals(result.publicSignals);
      
      console.log('\n📋 Public signals:');
      for (const [key, value] of Object.entries(namedSignals)) {
        console.log(`   ${key}: ${value}`);
      }
      
      if (result.valid) {
        console.log('\n✅ PROOF VALID — the supplier meets the stated requirements.');
        console.log('   The actual financial values remain PRIVATE.');
      } else {
        console.log('\n❌ PROOF INVALID — verification failed.');
      }
      
      process.exit(result.valid ? 0 : 1);
    } catch (err) {
      console.error('❌ Verification failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('mock')
  .description('Generate a mock/simulated proof (for demo when circuit is not compiled)')
  .requiredOption('-i, --input <path>', 'Path to input JSON file')
  .option('-o, --output <path>', 'Output path for proof JSON', './proof_output.json')
  .action(async (opts) => {
    console.log('\n⚠️  ZK-Procure DEMO Proof Generator');
    console.log('━'.repeat(50));
    console.log('This generates a structurally-correct but cryptographically-trivial proof.');
    console.log('For real proofs, compile the circuit first: pnpm --filter zk-prover-cli build:circuit\n');
    
    const inputs = JSON.parse(readFileSync(opts.input, 'utf-8'));
    const result = generateMockProof(inputs);
    
    writeFileSync(opts.output, JSON.stringify(result, null, 2));
    console.log(`📁 Mock proof written to: ${opts.output}`);
  });

program.parse();
