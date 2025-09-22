document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('music-form');
    const outputCode = document.getElementById('output-code');
    const copyBtn = document.getElementById('copy-btn');
    const favoriteBtn = document.getElementById('favorite-btn');

    const aiGenerateBtn = document.getElementById('ai-generate-btn');
    const vaguePromptInput = document.getElementById('vague-prompt');
    const aiStatus = document.getElementById('ai-status');

    const modal = document.getElementById('samples-modal');
    const showSamplesBtn = document.getElementById('show-samples-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const favoritesSelect = document.getElementById('favorites-select');
    const renameFavoriteBtn = document.getElementById('rename-favorite-btn');
    const deleteFavoriteBtn = document.getElementById('delete-favorite-btn');

    let promptFavorites = [];
    let currentFavoriteId = null;

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
        const apiKey = getConfig('GEMINI_API_KEY');
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            aiStatus.textContent = 'エラー: config.js ファイルに有効な API キーが設定されていません。';
            aiStatus.style.color = 'red';
            return;
        }

        const vaguePrompt = vaguePromptInput.value.trim();

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
        const finalOutput = {};
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
                finalOutput[key] = trimmedValue;
            }
        }

        outputCode.value = JSON.stringify(finalOutput, null, 4);
    };

    // --- Form Input Logic ---
    form.addEventListener('input', () => {
        updateJsonOutput();
    });
    
    // --- Favorites Logic ---
    const savePromptFavorites = () => {
        localStorage.setItem('promptFavorites', JSON.stringify(promptFavorites));
    };

    const renderPromptFavorites = () => {
        favoritesSelect.innerHTML = '';
        const defaultOption = new Option('保存したプロンプトを選択', '');
        favoritesSelect.add(defaultOption);

        promptFavorites.forEach(fav => {
            const option = new Option(fav.title, fav.id);
            favoritesSelect.add(option);
        });
    };

    const loadPromptFavorites = () => {
        const storedFavorites = localStorage.getItem('promptFavorites');
        if (storedFavorites) {
            promptFavorites = JSON.parse(storedFavorites);
            renderPromptFavorites();
        }
    };

    favoriteBtn.addEventListener('click', () => {
        if (currentFavoriteId) {
            // Overwrite existing favorite
            const favorite = promptFavorites.find(fav => fav.id === currentFavoriteId);
            if (favorite) {
                favorite.content = {
                    bpm: document.getElementById('bpm').value,
                    genre: document.getElementById('genre').value,
                    instruments: document.getElementById('instruments').value,
                    mood: document.getElementById('mood').value,
                    length: document.getElementById('length').value,
                    progression: document.getElementById('progression').value,
                };
                savePromptFavorites();
                alert('お気に入りを上書き保存しました。');
            }
        } else {
            // Add new favorite
            const title = prompt('このプロンプトのタイトルを入力してください:');
            if (title) {
                const newFavorite = {
                    id: Date.now(),
                    title: title,
                    content: {
                        bpm: document.getElementById('bpm').value,
                        genre: document.getElementById('genre').value,
                        instruments: document.getElementById('instruments').value,
                        mood: document.getElementById('mood').value,
                        length: document.getElementById('length').value,
                        progression: document.getElementById('progression').value,
                    }
                };
                promptFavorites.push(newFavorite);
                savePromptFavorites();
                renderPromptFavorites();
                favoritesSelect.value = newFavorite.id;
                currentFavoriteId = newFavorite.id;
                favoriteBtn.textContent = 'お気に入りを上書き保存';
            }
        }
    });

    favoritesSelect.addEventListener('change', () => {
        const selectedId = favoritesSelect.value;
        if (selectedId) {
            const selectedFav = promptFavorites.find(fav => fav.id == selectedId);
            if (selectedFav) {
                document.getElementById('bpm').value = selectedFav.content.bpm;
                document.getElementById('genre').value = selectedFav.content.genre;
                document.getElementById('instruments').value = selectedFav.content.instruments;
                document.getElementById('mood').value = selectedFav.content.mood;
                document.getElementById('length').value = selectedFav.content.length;
                document.getElementById('progression').value = selectedFav.content.progression;
                updateJsonOutput();
                currentFavoriteId = selectedFav.id;
                favoriteBtn.textContent = 'お気に入りを上書き保存';
            }
        } else {
            currentFavoriteId = null;
            favoriteBtn.textContent = 'お気に入りに追加';
        }
    });

    renameFavoriteBtn.addEventListener('click', () => {
        const selectedId = favoritesSelect.value;
        if (selectedId) {
            const favorite = promptFavorites.find(fav => fav.id == selectedId);
            if (favorite) {
                const newTitle = prompt('新しいタイトルを入力してください:', favorite.title);
                if (newTitle && newTitle.trim() !== '') {
                    favorite.title = newTitle.trim();
                    savePromptFavorites();
                    const previousSelectedId = favoritesSelect.value;
                    renderPromptFavorites();
                    favoritesSelect.value = previousSelectedId;
                }
            }
        } else {
            alert('名前を変更するお気に入りをドロップダウンから選択してください。');
        }
    });

    deleteFavoriteBtn.addEventListener('click', () => {
        const selectedId = favoritesSelect.value;
        if (selectedId) {
            promptFavorites = promptFavorites.filter(fav => fav.id != selectedId);
            savePromptFavorites();
            renderPromptFavorites();
            form.reset();
            updateJsonOutput();
            currentFavoriteId = null;
            favoriteBtn.textContent = 'お気に入りに追加';
        }
    });

    // --- Copy to Clipboard Logic ---
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputCode.value).then(() => {
            copyBtn.textContent = 'コピーしました！';
            setTimeout(() => {
                copyBtn.textContent = 'コピー';
            }, 2000);
        }).catch(err => {
            console.error('コピーに失敗しました', err);
        });
    });

    // Initial Load
    updateJsonOutput();
    loadPromptFavorites();
});
