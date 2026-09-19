// /api/submit.js
// Vercel Serverless Function — menerima jawaban peserta
// dan meneruskannya ke chat Telegram pribadi lewat Bot API.

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }

    const {
        TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID
    } = process.env;

    if (
        !TELEGRAM_BOT_TOKEN ||
        !TELEGRAM_CHAT_ID
    ) {
        console.error(
            'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars'
        );

        return res.status(500).json({
            error: 'Server not configured'
        });
    }

    let body = req.body;

    // Vercel biasanya sudah parse JSON otomatis,
    // tapi tetap jaga-jaga kalau body masih berupa string.
    if (typeof body === 'string') {

        try {

            body = JSON.parse(body);

        } catch (err) {

            return res.status(400).json({
                error: 'Invalid JSON'
            });

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

        submittedAt =
            new Date().toISOString()

    } = body || {};


    const {
        lifePath = null,
        birthday = null,
        expression = null,
        soulUrge = null
    } = numerology || {};


    // Batas ukuran supaya input tidak digunakan
    // untuk mengirim pesan Telegram yang terlalu besar.
    const clip = (
        text,
        max = 1500
    ) => {

        return (text || '')
            .toString()
            .slice(0, max);

    };


    const when =
        new Date(submittedAt)
            .toLocaleString(
                'id-ID',
                {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }
            );


    const message = [

        '🌿 REFLEKSI BARU — RUANG TENANG',

        `🕒 ${when}`,

        '',

        '━━━━━━━━━━━━━━━━━━',

        '👤 IDENTITAS',

        `Nama: ${clip(name, 150) || '(tidak diisi)'}`,

        `Tanggal lahir: ${
            clip(birthDate, 50) ||
            '(tidak diisi)'
        }`,

        '',

        '🔢 NUMEROLOGY',

        `Life Path: ${lifePath ?? '-'}`,

        `Birthday: ${birthday ?? '-'}`,

        `Expression: ${expression ?? '-'}`,

        `Soul Urge: ${soulUrge ?? '-'}`,

        '━━━━━━━━━━━━━━━━━━',

        '',

        '📝 REFLEKSI',

        '',

        `1) Yang terasa berat:
${clip(q1) || '(tidak diisi)'}`,

        '',

        `2) Keinginan asli vs ekspektasi:
${clip(q2) || '(tidak diisi)'}`,

        '',

        `3) Yang ingin dijaga/dibangun:
${clip(q3) || '(tidak diisi)'}`,

        '',

        `4) Arah yang dipilih:
${clip(direction || q4) || '(tidak diisi)'}`,

        '',

        `5) Langkah kecil pertama:
${clip(nextStep || q5) || '(tidak diisi)'}`,

        '',

        '━━━━━━━━━━━━━━━━━━',

        '🌱 Ruang Tenang'

    ].join('\n');


    try {

        const telegramRes =
            await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        chat_id:
                            TELEGRAM_CHAT_ID,

                        text:
                            message
                    })
                }
            );


        const telegramData =
            await telegramRes.json();


        if (!telegramData.ok) {

            console.error(
                'Telegram API error:',
                telegramData
            );

            return res.status(502).json({
                error:
                    'Failed to deliver message'
            });

        }


        return res.status(200).json({
            ok: true
        });


    } catch (err) {

        console.error(
            'submitReflection error:',
            err
        );

        return res.status(500).json({
            error:
                'Internal error'
        });

    }

}
