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

    if (license.status !== 'active') {
      return NextResponse.json({ error: 'License is not currently active.' }, { status: 400, headers: corsHeaders });
    }

    if (license.machine_id !== machineId) {
      return NextResponse.json({ error: 'Unauthorized. License is bound to a different machine.' }, { status: 403, headers: corsHeaders });
    }

    // Success - disassociate machine and set status to unused
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ status: 'unused', machine_id: null })
      .eq('id', license.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to disassociate license from machine.' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, message: 'License deactivated successfully. You can now use it on another machine.' }, { status: 200, headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
