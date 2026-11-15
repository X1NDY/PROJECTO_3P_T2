import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://nakggxqpmnyiufhtwscn.supabase.co";
const supabaseKey = "sb_publishable_jdbt3wTQ1HiNcYjDcYzerQ_xLmvNN9P";

export const supabase = createClient(supabaseUrl, supabaseKey);
