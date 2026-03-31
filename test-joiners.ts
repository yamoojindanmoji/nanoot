import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) process.exit(1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const queries = [
    '*, user_id(name, nickname, profile_image_url)',
    '*, users:user_id(name, nickname, profile_image_url)',
    '*, user:user_id(name, nickname, profile_image_url)',
    '*, profiles:user_id(name, nickname, profile_image_url)'
  ];
  for (const q of queries) {
    const { data, error } = await supabase.from('joiners').select(q).limit(1);
    console.log(`Query: ${q}`);
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Success! Data keys:', Object.keys(data[0] || {}));
      process.exit(0);
    }
  }
}
run();
