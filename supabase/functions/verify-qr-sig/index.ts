import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const uid = url.searchParams.get('uid')
    const day = parseInt(url.searchParams.get('day') || '0')
    const sig = url.searchParams.get('sig')

    if (!uid || !day || !sig) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing parameters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const QR_SECRET = Deno.env.get('QR_SIGNATURE_SECRET') || 'change-me-in-production'
    const payload = `${uid}:${day}`
    
    const keyData = new TextEncoder().encode(QR_SECRET)
    const messageData = new TextEncoder().encode(payload)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData)
    const expectedSig = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const valid = expectedSig === sig

    return new Response(
      JSON.stringify({ valid }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

