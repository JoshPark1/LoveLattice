import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const { licenseKey, machineId } = await request.json();

    if (!licenseKey || !machineId) {
      return NextResponse.json({ error: 'License key and Machine ID are required.' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the license in the database
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      return NextResponse.json({ error: 'Invalid license key.' }, { status: 404, headers: corsHeaders });
    }

    // Checking logic
    if (license.status === 'revoked') {
      return NextResponse.json({ error: 'This license has been revoked.' }, { status: 403, headers: corsHeaders });
    }

    if (license.status === 'unused') {
      // First time activation! Lock it to this machine
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ status: 'active', machine_id: machineId })
        .eq('id', license.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to bind license to machine.' }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, message: 'License activated successfully!' }, { status: 200, headers: corsHeaders });
    }

    // If it's already active, verify it matches the SAME machine ID
    if (license.status === 'active') {
      if (license.machine_id === machineId) {
        return NextResponse.json({ success: true, message: 'License verified.' }, { status: 200, headers: corsHeaders });
      } else {
        return NextResponse.json({ error: 'License is already bound to another machine.' }, { status: 403, headers: corsHeaders });
      }
    }

    return NextResponse.json({ error: 'Unknown license state.' }, { status: 400, headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
