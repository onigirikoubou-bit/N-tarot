const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// JSONのボディパーサー
app.use(express.json());

// ★ 追加：CORS（クロスドメイン）を許可する設定
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
    // GitHubの Secrets や環境変数からAPIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'APIキーがサーバーの環境変数に設定されていません。' });
    }

    try {
        const { prompt } = req.body;

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
            throw new Error(errorData.error?.message || 'Gemini APIとの通信に失敗しました。');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});