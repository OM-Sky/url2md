import { FastifyRequest, FastifyReply } from 'fastify';
import { generateKey } from './auth.js';
import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
  }
  return _resend;
}


interface LemonPayload {
  meta?: {
    event_name?: string;
  };
  data?: {
    attributes?: {
      user_email?: string;
      status?: string;
    };
  };
}

export async function handleLemonWebhook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const payload = request.body as LemonPayload;

  const eventName = payload?.meta?.event_name;
  const email = payload?.data?.attributes?.user_email;
  const status = payload?.data?.attributes?.status;

  console.log(`[webhook] event=${eventName} email=${email} status=${status}`);

  if (eventName !== 'order_created') {
    reply.send({ ok: true, message: 'ignored' });
    return;
  }

  if (!email) {
    reply.code(400).send({ error: 'Missing user_email in payload' });
    return;
  }

  if (status !== 'paid') {
    reply.send({ ok: true, message: 'order not paid yet' });
    return;
  }

  const apiKey = await generateKey(email);
  console.log(`[webhook] Generated key for ${email}: ${apiKey}`);

  try {
    await getResend().emails.send({
      from: 'url2md <onboarding@resend.dev>',
      to: email,
      subject: 'Your url2md Pro API Key',
      html: `
        <h2>Welcome to url2md Pro! 🎉</h2>
        <p>Thank you for subscribing. Here is your API key:</p>
        <pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-size:14px;">${apiKey}</pre>
        <h3>How to use it</h3>
        <p>Add <code>?key=YOUR_KEY</code> to any scrape request:</p>
        <pre style="background:#f4f4f4;padding:12px;border-radius:6px;">curl "https://url2md.up.railway.app/scrape?url=https://example.com&key=${apiKey}"</pre>
        <p>Enjoy unlimited requests. Support: reply to this email.</p>
      `,
    });
    console.log(`[webhook] Email sent to ${email}`);
  } catch (err) {
    console.error('[webhook] Failed to send email:', err);
    // Don't fail the webhook — key is already generated
  }

  reply.send({ ok: true, email, keyGenerated: true });
}
