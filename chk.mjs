import { createClient } from '@supabase/supabase-js'
const U='https://admghqsjdkxwovuckazv.supabase.co', K='sb_publishable_jsRXfkj7hDu-20k7JYufWw_moEGjdJz'
const c = createClient(U,K,{auth:{persistSession:false}})
const s = await c.auth.signInWithPassword({ email:'zztest-f@probanden.invalid', password:'PruefPasswort123' })
if (s.error) { console.log('Pruefzugang weg:', s.error.message); process.exit(0) }
const { data } = await c.from('profiles').select('code, rolle').order('code')
console.log('Vorhandene Zugaenge:')
console.log(data.map(x => `  ${x.code.padEnd(14)} ${x.rolle}`).join('\n') || '  (keine)')
