import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { Client } = pg;

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  
  try {
    const seedFile = path.join(__dirname, '../../../../db/seed.sql'); // Adjust path based on project root
    if (fs.existsSync(seedFile)) {
      console.log('Running seed...');
      const sql = fs.readFileSync(seedFile, 'utf-8');
      await client.query(sql);
      console.log('Seed complete');
    } else {
      console.log('No seed file found at', seedFile);
    }
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await client.end();
  }
}

seed();
