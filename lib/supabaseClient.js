import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Ce message aide au diagnostic si les variables d'environnement
  // Vercel/locales ne sont pas configurées. On utilise des valeurs
  // factices pour ne jamais faire planter le build : les appels
  // réseau échoueront proprement à l'exécution avec un message clair
  // dans l'interface, plutôt que de casser tout le site.
  console.warn(
    '[Supabase] Variables d\'environnement manquantes : ' +
    'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Consultez le README pour les configurer.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
