document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('music-form');
    const outputCode = document.getElementById('output-code');
    const copyBtn = document.getElementById('copy-btn');

    const aiGenerateBtn = document.getElementById('ai-generate-btn');
    const apiKeyInput = document.getElementById('api-key');
    const vaguePromptInput = document.getElementById('vague-prompt');
    const aiStatus = document.getElementById('ai-status');

    const modal = document.getElementById('samples-modal');
    const showSamplesBtn = document.getElementById('show-samples-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // --- Modal Logic ---
    showSamplesBtn.addEventListener('click', () => {
        modal.classList.remove('modal-hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('modal-hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.classList.add('modal-hidden');
        }
    });

    // --- AI Generation Logic ---
    aiGenerateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const vaguePrompt = vaguePromptInput.value.trim();

        if (!apiKey) {
            aiStatus.textContent = 'エラー: APIキーを入力してください。';
            aiStatus.style.color = 'red';
            return;
        }

        if (!vaguePrompt) {
            aiStatus.textContent = 'エラー: 曖昧なイメージやテキストを入力してください。';
            aiStatus.style.color = 'red';
            return;
        }

        aiStatus.textContent = 'AIがプロンプトを生成中です...';
        aiStatus.style.color = '#8a4fff';

        const metaPrompt = `
あなたは優秀な音楽ディレクターです。
ユーザーから提供された曖昧なイメージやテキストに基づいて、音楽制作用の詳細なプロンプトを作成してください。

以下の6つの項目を必ず作成し、それぞれを「|||」で区切って、1行で出力してください。
他の説明や前置きは一切不要です。

1. BPM: 曲のテンポを数字で。
2. ジャンル: 音楽のジャンルやスタイル。
3. 楽器: 使用する楽器の編成。
4. 雰囲気: 曲のムードや感情。
5. 長さ: 曲の全体の長さ。
6. 進行: 曲の構成や展開。

ユーザーの入力: "${vaguePrompt}"
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: metaPrompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'APIリクエストに失敗しました。');
            }

            const data = await response.json();
            const generatedText = data.candidates[0].content.parts[0].text;
            
            const parts = generatedText.split('|||').map(p => p.trim());
            
            if (parts.length === 6) {
                document.getElementById('bpm').value = parts[0].replace(/BPM:/i, '').trim();
                document.getElementById('genre').value = parts[1].replace(/ジャンル:/i, '').trim();
                document.getElementById('instruments').value = parts[2].replace(/楽器:/i, '').trim();
                document.getElementById('mood').value = parts[3].replace(/雰囲気:/i, '').trim();
                document.getElementById('length').value = parts[4].replace(/長さ:/i, '').trim();
                document.getElementById('progression').value = parts[5].replace(/進行:/i, '').trim();
                aiStatus.textContent = 'プロンプトが生成されました。各項目を確認・編集してください。';
                aiStatus.style.color = 'green';
                updateJsonOutput(); // AI生成後、JSON出力を更新
            } else {
                throw new Error('AIからの応答形式が正しくありません。');
            }

        } catch (error) {
            aiStatus.textContent = `エラー: ${error.message}`;
            aiStatus.style.color = 'red';
        }
    });

    // --- Real-time JSON Generation Logic ---
    const updateJsonOutput = () => {
        const formData = new FormData(form);
        const parts = [];
        const fields = {
            'BPM': formData.get('bpm'),
            'ジャンル': formData.get('genre'),
            '楽器': formData.get('instruments'),
            '雰囲気': formData.get('mood'),
            '長さ': formData.get('length'),
            '進行': formData.get('progression'),
        };

        for (const [key, value] of Object.entries(fields)) {
            const trimmedValue = value.trim();
            if (trimmedValue) {
                parts.push(`${key}: ${trimmedValue}`);
            }
        }

        const requestString = parts.join(', ');
        const finalOutput = { request: requestString };
        outputCode.textContent = JSON.stringify(finalOutput, null, 4);
    };

    // フォームの任意の入力が変更されたらJSONを更新
    form.addEventListener('input', updateJsonOutput);
    // 初期表示時にもJSONを生成
    updateJsonOutput();

    // --- Copy to Clipboard Logic ---
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputCode.textContent).then(() => {
            copyBtn.textContent = 'コピーしました！';
            setTimeout(() => {
                copyBtn.textContent = 'コピー';
            }, 2000);
        }).catch(err => {
            console.error('コピーに失敗しました', err);
        });
    });
});
