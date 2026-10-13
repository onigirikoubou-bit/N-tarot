const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// JSONのボディパーサー
app.use(express.json());

// CORS（クロスドメイン）を許可する設定
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://onigirikoubou-bit.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 同一階層の静的ファイル（index.html, manifest.json 等）を配信
app.use(express.static(path.join(__dirname)));

// フロントエンドからの鑑定リクエストを安全に中継するエンドポイント
app.post('/api/reading', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('エラー: GEMINI_API_KEYが環境変数に設定されていません。');
        return res.status(500).json({ error: 'APIキーがサーバーの環境変数に設定されていません。' });
    }

    try {
        const { prompt } = req.body;
        console.log('Gemini APIへリクエストを送信します...');

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API エラー詳細:', JSON.stringify(errorData));
            throw new Error(errorData.error?.message || 'Gemini APIとの通信に失敗しました。');
        }

        const data = await response.json();
        console.log('Gemini APIから正常にレスポンスを受信しました。');
        res.json(data);
    } catch (error) {
        console.error('サーバー内部エラー:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});