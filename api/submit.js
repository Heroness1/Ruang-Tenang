// /api/submit.js
// Vercel Serverless Function: receives a participant's reflection
// and forwards it to a private Telegram chat via the Bot API.

const TELEGRAM_LIMIT = 4000; // Telegram caps messages at 4096 chars

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
        return res.status(500).json({ error: 'Server not configured' });
    }

    let body = req.body;

    // Vercel normally parses JSON already, but guard against a raw string.
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
    }

    const {
        name = '',
        birthDate = '',
        numerology = {},
        q1 = '',
        q2 = '',
        q3 = '',
        q4 = '',
        q5 = '',
        direction = '',
        nextStep = '',
        submittedAt = new Date().toISOString()
    } = body || {};

    const {
        lifePath = null,
        birthday = null,
        expression = null,
        soulUrge = null,
        personality = null
    } = numerology || {};

    // Cap field sizes so input can't be used to send oversized messages.
    const clip = (text, max = 1500) =>
        (text ?? '').toString().slice(0, max);

    const empty = '(left blank)';

    const parsed = new Date(submittedAt);
    const when = (isNaN(parsed) ? new Date() : parsed).toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: process.env.TIMEZONE || 'Asia/Jakarta'
    });

    const message = [
        '🌿 NEW REFLECTION: QUIET SPACE',
        `🕒 ${when}`,
        '',
        '━━━━━━━━━━━━━━━━━━',
        '👤 IDENTITY',
        `Name: ${clip(name, 150) || empty}`,
        `Date of birth: ${clip(birthDate, 50) || empty}`,
        '',
        '🔢 NUMEROLOGY',
        `Life Path: ${clip(lifePath, 10) || '-'}`,
        `Expression: ${clip(expression, 10) || '-'}`,
        `Soul Urge: ${clip(soulUrge, 10) || '-'}`,
        `Personality: ${clip(personality, 10) || '-'}`,
        `Birthday: ${clip(birthday, 10) || '-'}`,
        '━━━━━━━━━━━━━━━━━━',
        '',
        '📝 REFLECTION',
        '',
        `1) On their mind lately:\n${clip(q1) || empty}`,
        '',
        `2) The relationship they want:\n${clip(q2) || empty}`,
        '',
        `3) What they fear happening again:\n${clip(q3) || empty}`,
        '',
        `4) The partner they want to be:\n${clip(q4) || empty}`,
        '',
        `5) Hopes for their love life:\n${clip(direction || q5) || empty}`,
        '',
        `🌱 Small next step:\n${clip(nextStep) || empty}`,
        '',
        '━━━━━━━━━━━━━━━━━━',
        '🌿 Quiet Space'
    ].join('\n');

    // Split into chunks under Telegram's limit, breaking on line boundaries.
    const chunks = [];
    let current = '';
    for (const line of message.split('\n')) {
        if ((current + '\n' + line).length > TELEGRAM_LIMIT) {
            chunks.push(current);
            current = line;
        } else {
            current = current ? current + '\n' + line : line;
        }
    }
    if (current) chunks.push(current);

    try {
        for (const text of chunks) {
            const telegramRes = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
                }
            );

            const telegramData = await telegramRes.json();

            if (!telegramData.ok) {
                console.error('Telegram API error:', telegramData);
                return res.status(502).json({ error: 'Failed to deliver message' });
            }
        }

        return res.status(200).json({ ok: true });

    } catch (err) {
        console.error('submitReflection error:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
}
