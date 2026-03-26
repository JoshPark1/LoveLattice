import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizePhoneNumber, getPhoneValidationMessage } from '../_lib/phone';

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
    const { licenseKey, machineId, phoneNumber } = await request.json();

    if (!licenseKey || !machineId || !phoneNumber) {
      return NextResponse.json({ error: 'License key, machine ID, and phone number are required.' }, { status: 400, headers: corsHeaders });
    }

    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhoneNumber) {
      return NextResponse.json({ error: getPhoneValidationMessage() }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: license, error } = await supabase
      .from('licenses')
      .select('id, status, machine_id')
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      return NextResponse.json({ error: 'Invalid license key.' }, { status: 404, headers: corsHeaders });
    }

    if (license.status !== 'active' || license.machine_id !== machineId) {
      return NextResponse.json({ error: 'Unauthorized. License must be active on this machine.' }, { status: 403, headers: corsHeaders });
    }

    const { error: updateError } = await supabase
      .from('licenses')
      .update({ phone_number: normalizedPhoneNumber })
      .eq('id', license.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save phone number.' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, phoneNumber: normalizedPhoneNumber }, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}
