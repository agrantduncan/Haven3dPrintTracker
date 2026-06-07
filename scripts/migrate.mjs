import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

// Load .env.local manually
const envPath = new URL('../.env.local', import.meta.url).pathname;
const envContent = readFileSync(envPath, 'utf8');
const DATABASE_URL = envContent.match(/DATABASE_URL=(.+)/)?.[1]?.trim();

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS inventory (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )
`;

console.log('✓ inventory table ready');
