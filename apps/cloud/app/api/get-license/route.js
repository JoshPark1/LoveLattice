import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: license, error } = await supabase
      .from('licenses')
      .select('license_key')
      .eq('stripe_session_id', sessionId.trim())
      .single();

    if (error || !license) {
      console.log(`[DEBUG - get-license] FAILED to find session ID: "${sessionId}"`);
      console.log(`[DEBUG - get-license] Supabase Error:`, error);
      return NextResponse.json({ error: `Not found: ${error?.message || 'No license'}` }, { status: 404 });
    }

    // Generate a secure, 1-hour expiring download link for the .dmg file
    const { data: signedUrlData, error: storageError } = await supabase
      .storage
      .from('releases')
      .createSignedUrl('lovelattice-mac.dmg', 3600);
      
    const downloadUrl = signedUrlData ? signedUrlData.signedUrl : null;

    return NextResponse.json({ 
      licenseKey: license.license_key,
      downloadUrl: downloadUrl
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
