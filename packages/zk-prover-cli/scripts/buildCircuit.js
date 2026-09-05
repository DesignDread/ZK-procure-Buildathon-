#!/usr/bin/env node

/**
 * ZK Circuit Build Script
 * 
 * Compiles the Circom circuit, runs the Groth16 trusted setup (demo-only),
 * and generates the verification key.
 * 
 * Requirements: circom (Rust binary) must be in PATH, or use the npm circom package.
 * For demo purposes, uses a pre-existing Powers of Tau ceremony file.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CIRCUITS_DIR = join(__dirname, '..', 'circuits');
const BUILD_DIR = join(__dirname, '..', 'build');
const CIRCUIT_NAME = 'procurement';

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function run(cmd, cwd = BUILD_DIR) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    throw err;
  }
}

async function main() {
  console.log('=== ZK-Procure Circuit Build ===\n');
  
  ensureDir(BUILD_DIR);

  const circuitPath = join(CIRCUITS_DIR, `${CIRCUIT_NAME}.circom`);
  if (!existsSync(circuitPath)) {
    console.error(`Circuit not found: ${circuitPath}`);
    process.exit(1);
  }

  // Step 1: Compile the circuit
  console.log('Step 1: Compiling circuit with circom...');
  try {
    run(`circom "${circuitPath}" --r1cs --wasm --sym --output "${BUILD_DIR}"`, __dirname);
  } catch {
    console.log('\nCircom binary not found or compilation failed.');
    console.log('Generating simplified test artifacts instead...');
    await generateTestArtifacts();
    return;
  }

  // Step 2: Download Powers of Tau (if not present)
  const ptauPath = join(BUILD_DIR, 'pot14_final.ptau');
  if (!existsSync(ptauPath)) {
    console.log('\nStep 2: Downloading Powers of Tau ceremony file...');
    try {
      run(`npx snarkjs powersoftau new bn128 14 "${join(BUILD_DIR, 'pot14_0000.ptau')}" -v`);
      run(`npx snarkjs powersoftau contribute "${join(BUILD_DIR, 'pot14_0000.ptau')}" "${join(BUILD_DIR, 'pot14_0001.ptau')}" --name="Demo contribution" -v -e="random entropy for demo"`);
      run(`npx snarkjs powersoftau prepare phase2 "${join(BUILD_DIR, 'pot14_0001.ptau')}" "${ptauPath}" -v`);
    } catch {
      console.log('Powers of Tau generation failed. Using test artifacts.');
      await generateTestArtifacts();
      return;
    }
  }

  // Step 3: Groth16 setup
  console.log('\nStep 3: Groth16 trusted setup (DEMO ONLY - not production ceremony)...');
  const r1csPath = join(BUILD_DIR, `${CIRCUIT_NAME}.r1cs`);
  const zkeyPath = join(BUILD_DIR, `${CIRCUIT_NAME}_0000.zkey`);
  const finalZkeyPath = join(BUILD_DIR, `${CIRCUIT_NAME}_final.zkey`);
  
  run(`npx snarkjs groth16 setup "${r1csPath}" "${ptauPath}" "${zkeyPath}"`);
  run(`npx snarkjs zkey contribute "${zkeyPath}" "${finalZkeyPath}" --name="Demo contribution" -v -e="demo entropy"`);
  
  // Step 4: Export verification key
  console.log('\nStep 4: Exporting verification key...');
  const vkeyPath = join(BUILD_DIR, 'verification_key.json');
  run(`npx snarkjs zkey export verificationkey "${finalZkeyPath}" "${vkeyPath}"`);

  // Step 5: Copy verification key to API
  const apiVkeyPath = join(__dirname, '..', '..', '..', 'apps', 'api', 'src', 'zk', 'build', 'verification_key.json');
  ensureDir(dirname(apiVkeyPath));
  const vkeyContent = readFileSync(vkeyPath, 'utf-8');
  writeFileSync(apiVkeyPath, vkeyContent);
  
  console.log('\n=== Circuit build complete! ===');
  console.log(`  R1CS: ${r1csPath}`);
  console.log(`  WASM: ${join(BUILD_DIR, CIRCUIT_NAME + '_js', CIRCUIT_NAME + '.wasm')}`);
  console.log(`  ZKey: ${finalZkeyPath}`);
  console.log(`  VKey: ${vkeyPath}`);
}

/**
 * Generate simplified test artifacts when circom is not available.
 * These allow the system to run in demo mode without the full circuit compilation.
 */
async function generateTestArtifacts() {
  console.log('\nGenerating test/demo artifacts (no real ZK proofs)...');
  
  // Create a placeholder verification key
  const vkey = {
    protocol: "groth16",
    curve: "bn128",
    nPublic: 9,
    vk_alpha_1: ["20491192805390485299153009773594534940189261866228447918068658471970481763042", "9383485363053290200918347156157836566562967994039712273449902621266178545958", "1"],
    vk_beta_2: [
      ["6375614351688725206403948262868962793625744043794305715222011528459656738731", "4252822878758300859123897981450591353533073413197771768651442665752259397132"],
      ["10505242626370262277552901082094356697409835680220590971873171140371331206856", "21847035105528745403288232691147584728191162732299865338377159692350059136679"],
      ["1", "0"]
    ],
    vk_gamma_2: [
      ["10857046999023057135944570762232829481370756359578518086990519993285655852781", "11559732032986387107991004021392285783925812861821192530917403151452391805634"],
      ["8495653923123431417604973247489272438418190587263600148770280649306958101930", "4082367875863433681332203403145435568316851327593401208105741076214120093531"],
      ["1", "0"]
    ],
    vk_delta_2: [
      ["10857046999023057135944570762232829481370756359578518086990519993285655852781", "11559732032986387107991004021392285783925812861821192530917403151452391805634"],
      ["8495653923123431417604973247489272438418190587263600148770280649306958101930", "4082367875863433681332203403145435568316851327593401208105741076214120093531"],
      ["1", "0"]
    ],
    vk_alphabeta_12: [],
    IC: [
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"],
      ["0", "0", "1"]
    ]
  };

  writeFileSync(join(BUILD_DIR, 'verification_key.json'), JSON.stringify(vkey, null, 2));
  
  // Copy to API
  const apiVkeyDir = join(__dirname, '..', '..', '..', 'apps', 'api', 'src', 'zk', 'build');
  ensureDir(apiVkeyDir);
  writeFileSync(join(apiVkeyDir, 'verification_key.json'), JSON.stringify(vkey, null, 2));

  // Create a marker file indicating demo mode
  writeFileSync(join(BUILD_DIR, 'DEMO_MODE.txt'), 
    'This build uses placeholder artifacts.\n' +
    'Real ZK proofs require circom compilation.\n' +
    'Install circom (https://docs.circom.io/getting-started/installation/) and run:\n' +
    '  pnpm --filter zk-prover-cli build:circuit\n'
  );

  console.log('Test artifacts generated. System will run in demo/simulation mode.');
  console.log('For real ZK proofs, install circom and run: pnpm --filter zk-prover-cli build:circuit');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
