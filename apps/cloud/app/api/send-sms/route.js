import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { message, licenseKey } = await request.json();
    
    // 1. Basic validation
    if (!message) {
      return NextResponse.json({ error: 'Message payload required' }, { status: 400 });
    }
    if (!licenseKey) {
      return NextResponse.json({ error: 'A valid LoveLattice License Key is required.' }, { status: 401 });
    }

    // 2. Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verify License in Database
    const { data: license, error: dbError } = await supabase
      .from('licenses')
      .select('id, status, sms_count')
      .eq('license_key', licenseKey)
      .single();

    if (dbError || !license || license.status !== 'active') {
      console.log(`Unauthorized SMS attempt block! Invalid or inactive key: ${licenseKey}`);
      return NextResponse.json({ error: 'Unauthorized: Invalid or inactive license key.' }, { status: 403 });
    }

    // 4. Rate Limiting Protection (Max 100 lifetime SMS per $5 purchase)
    const MAX_SMS = 100;
    const currentCount = license.sms_count || 0;
    
    if (currentCount >= MAX_SMS) {
      console.log(`[BLOCKED] License ${licenseKey} has hit its 100 SMS limit!`);
      return NextResponse.json({ error: 'Lifetime SMS limit reached. App will continue tracking, but texts are disabled.' }, { status: 429 });
    }

    // 5. If valid, initialize Twilio and send text
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log("Twilio credentials missing. Logging message:", message);
      return NextResponse.json({ success: true, message: 'SMS Dispatched (Simulated)' });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.USER_PHONE_NUMBER
    });

    // 6. Very important: Charge them 1 credit by updating the database!
    await supabase
      .from('licenses')
      .update({ sms_count: currentCount + 1 })
      .eq('id', license.id);

    console.log(`SMS sent! License ${licenseKey} now has ${MAX_SMS - (currentCount + 1)} texts remaining.`);
    return NextResponse.json({ success: true, message: 'SMS Dispatched' });

  } catch (error) {
    console.error("Failed to send SMS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
