import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getCurrentMacRelease } from '../_lib/release';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase with the Secret Role Key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to generate a LoveLattice license key: LOVE-XXXX-XXXX-XXXX
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `LOVE-${segment()}-${segment()}-${segment()}`;
}

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email;
      const stripeSessionId = session.id;

      console.log(`Payment successful for: ${customerEmail}`);
      
      // 1. Generate a fresh License Key
      const licenseKey = generateLicenseKey();

      // 2. Insert into Supabase
      const { error: dbError } = await supabase
        .from('licenses')
        .insert([{
          customer_email: customerEmail,
          license_key: licenseKey,
          stripe_session_id: stripeSessionId,
          status: 'unused',
          machine_id: null
        }]);

      if (dbError) {
        console.error("Failed to insert license into Supabase:", dbError.message);
      } else {
        console.log(`Successfully securely saved License Key [${licenseKey}] to Supabase database!`);
      }

      // 3. Generate a 7-day secure download link for the current Apple Silicon dmg
      let downloadUrl = `https://love-lattice-cloud.vercel.app/success?session_id=${stripeSessionId}`;
      try {
        const { dmgName } = await getCurrentMacRelease(supabase);
        const { data: signedUrlData } = await supabase
          .storage
          .from('releases')
          .createSignedUrl(dmgName, 3600 * 24 * 7);

        if (signedUrlData?.signedUrl) {
          downloadUrl = signedUrlData.signedUrl;
        }
      } catch (storageError) {
        console.error('Failed to build signed release download URL:', storageError.message);
      }

      // 4. Send the beautiful receipt email
      if (customerEmail) {
        try {
          await resend.emails.send({
            from: 'LoveLattice <onboarding@resend.dev>', // Note: Use your custom domain once verified
            to: customerEmail,
            subject: 'LoveLattice Setup & License Key',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #1a1a1a;">
                <h1 style="color: #ff4d5a; margin-bottom: 30px; font-size: 28px;">Welcome to LoveLattice.</h1>
                <p style="font-size: 16px;">Thank you for your purchase! Your permanent license key has been successfully generated.</p>
                
                <div style="background-color: #f4f4f5; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; border: 1px solid #e4e4e7;">
                  <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; font-weight: bold;">Your Unique Key</span>
                  <div style="font-family: monospace; font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #ff4d5a; margin-top: 10px;">
                    ${licenseKey}
                  </div>
                </div>
                
                <h3 style="margin-top: 40px; color: #1a1a1a;">Step 1: Download the App</h3>
                <p style="font-size: 16px; color: #71717a;">Download the incredibly lightweight desktop application for macOS (11.0+) on Apple Silicon.</p>
                <a href="${downloadUrl}" style="display: inline-block; background-color: #ff4d5a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px; margin-bottom: 25px;">Download LoveLattice for Mac (Apple Silicon)</a>
                <p style="font-size: 13px; color: #a1a1aa; font-style: italic;">*For your security, this encrypted download link will expire in 7 days.</p>
                
                <h3 style="margin-top: 30px; color: #1a1a1a;">Step 2: Hardware Activation</h3>
                <p style="font-size: 16px; color: #71717a;">Drag the application into your Mac's <strong>Applications</strong> folder. When you open it for the first time, you will be prompted to paste your unique license key to permanently bind it to your computer.</p>
                
                <h3 style="margin-top: 30px; color: #1a1a1a;">Step 3: First-Time Mac Setup</h3>
                <p style="font-size: 16px; color: #71717a;">Because LoveLattice is an independent app, macOS requires a one-time terminal command to bypass Gatekeeper. Please follow the 30-second setup instructions here: <a href="https://love-lattice-cloud.vercel.app/#setup" style="color: #ff4d5a; font-weight: bold;">View Setup Guide</a></p>

                <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 40px 0;" />
                <p style="font-size: 14px; color: #a1a1aa; text-align: center;">If you experience any issues, please reply directly to this email.</p>
              </div>
            `
          });
          console.log(`Successfully dispatched receipt email to: ${customerEmail}`);
        } catch (emailErr) {
          console.error("Failed to send receipt email via Resend:", emailErr);
        }
      }
      
    } else {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error handling Stripe Webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
