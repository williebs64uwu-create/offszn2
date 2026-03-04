import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkColumns() {
    console.log('--- Conversations ---');
    const { data: convs } = await supabase.from('conversations').select('*').limit(1);
    console.log('Columns:', Object.keys(convs[0] || {}));

    console.log('\n--- Messages ---');
    const { data: msgs } = await supabase.from('messages').select('*').limit(1);
    console.log('Columns:', Object.keys(msgs[0] || {}));
}

checkColumns();
