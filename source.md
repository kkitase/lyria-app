Lyria RealTime を使用した音楽生成

Gemini API は、Lyria RealTime を使用して、最先端のリアルタイム ストリーミング音楽生成モデルへのアクセスを提供します。ユーザーがインタラクティブに作成し、継続的に操作して、インストゥルメンタル音楽を演奏できるアプリケーションをデベロッパーが構築できるようにします。

試験運用版: Lyria RealTime は試験運用版モデルです。
Lyria RealTime を使用して構築できるものを体験するには、AI Studio で Prompt DJ アプリまたは MIDI DJ アプリをお試しください。

音楽生成の仕組み
Lyria RealTime 音楽生成では、WebSocket を使用して、永続的で双方向の低レイテンシ ストリーミング接続を使用します。

音楽を生成して操作する
Lyria RealTime は、モデルとのリアルタイム通信を維持するために WebSocket を使用しているという点で、Live API と似ています。モデルと会話することはできず、特定の形式でプロンプトを入力する必要があるため、完全に同じではありません。

次のコードは、音楽を生成する方法を示しています。

Python
JavaScript
この例では、client.aio.live.music.connect() を使用して Lyria RealTime セッションを初期化し、session.set_weighted_prompts() を使用して最初のプロンプトを送信します。また、session.set_music_generation_config を使用して初期構成を送信し、session.play() を使用して音楽生成を開始し、受信した音声チャンクを処理するように receive_audio() を設定します。


  import asyncio
  from google import genai
  from google.genai import types

  client = genai.Client(http_options={'api_version': 'v1alpha'})

  async def main():
      async def receive_audio(session):
        """Example background task to process incoming audio."""
        while True:
          async for message in session.receive():
            audio_data = message.server_content.audio_chunks[0].data
            # Process audio...
            await asyncio.sleep(10**-12)

      async with (
        client.aio.live.music.connect(model='models/lyria-realtime-exp') as session,
        asyncio.TaskGroup() as tg,
      ):
        # Set up task to receive server messages.
        tg.create_task(receive_audio(session))

        # Send initial prompts and config
        await session.set_weighted_prompts(
          prompts=[
            types.WeightedPrompt(text='minimal techno', weight=1.0),
          ]
        )
        await session.set_music_generation_config(
          config=types.LiveMusicGenerationConfig(bpm=90, temperature=1.0)
        )

        # Start streaming music
        await session.play()
  if __name__ == "__main__":
      asyncio.run(main())
より完全なコードサンプルについては、クックブック リポジトリの「Lyria RealTime - Get Started」ファイルをご覧ください。

GitHub で表示

session.play()、session.pause()、session.stop()、session.reset_context() を使用して、セッションの開始、一時停止、停止、リセットを行うことができます。

音楽をリアルタイムで操作する
Prompt Lyria RealTime
ストリームがアクティブな間は、いつでも新しい WeightedPrompt メッセージを送信して、生成された音楽を変更できます。モデルは新しい入力に基づいてスムーズに移行します。

プロンプトは、text（実際のプロンプト）と weight を含む正しい形式で指定する必要があります。weight には、0 以外の任意の値を使用できます。通常、1.0 から始めることをおすすめします。

Python
JavaScript

  await session.set_weighted_prompts(
    prompts=[
      {"text": "Piano", "weight": 2.0},
      types.WeightedPrompt(text="Meditation", weight=0.5),
      types.WeightedPrompt(text="Live Performance", weight=1.0),
    ]
  )
プロンプトを大幅に変更すると、モデルの切り替えが急激になることがあります。そのため、中間的な重み値をモデルに送信して、クロスフェードを実装することをおすすめします。

構成を更新する
音楽生成パラメータをリアルタイムで更新することもできます。パラメータを更新するだけでなく、構成全体を設定する必要があります。そうしないと、他のフィールドがデフォルト値にリセットされます。

bpm またはスケールを更新すると、モデルが大幅に変更されるため、reset_context() を使用してコンテキストをリセットし、新しい構成を考慮するようにモデルに指示する必要があります。ストリームは停止しませんが、移行はハードになります。他のパラメータに対して行う必要はありません。

Python
JavaScript

  await session.set_music_generation_config(
    config=types.LiveMusicGenerationConfig(
      bpm=128,
      scale=types.Scale.D_MAJOR_B_MINOR,
      music_generation_mode=types.MusicGenerationMode.QUALITY
    )
  )
  await session.reset_context();
Lyria RealTime のプロンプト ガイド
Lyria RealTime にプロンプトを送信するために使用できるプロンプトの例を以下に示します。

Instruments: 303 Acid Bass, 808 Hip Hop Beat, Accordion, Alto Saxophone, Bagpipes, Balalaika Ensemble, Banjo, Bass Clarinet, Bongos, Boomy Bass, Bouzouki, Buchla Synths, Cello, Charango, Clavichord, Conga Drums, Didgeridoo, Dirty Synths, Djembe, Drumline, Dulcimer, Fiddle, Flamenco Guitar, Funk Drums, Glockenspiel, Guitar, Hang Drum, Harmonica, Harp, Harpsichord, Hurdy-gurdy, Kalimba, Koto, Lyre, Mandolin, Maracas, Marimba, Mbira, Mellotron, Metallic Twang, Moog Oscillations, Ocarina, Persian Tar, Pipa, Precision Bass, Ragtime Piano, Rhodes Piano, Shamisen, Shredding Guitar, Sitar, Slide Guitar, Smooth Pianos, Spacey Synths, Steel Drum, Synth Pads, Tabla, TR-909 Drum Machine, Trumpet, Tuba, Vibraphone, Viola Ensemble, Warm Acoustic Guitar, Woodwinds, ...

音楽のジャンル: Acid Jazz, Afrobeat, Alternative Country, Baroque, Bengal Baul, Bhangra, Bluegrass, Blues Rock, Bossa Nova, Breakbeat, Celtic Folk, Chillout, Chiptune, Classic Rock, Contemporary R&B, Cumbia, Deep House, Disco Funk, Drum & Bass, Dubstep, EDM, Electro Swing, Funk Metal, G-funk, Garage Rock, Glitch Hop, Grime, Hyperpop, Indian Classical, Indie Electronic, Indie Folk, Indie Pop, Irish Folk, Jam Band, Jamaican Dub, Jazz Fusion, Latin Jazz, Lo-Fi Hip Hop, Marching Band, Merengue, New Jack Swing, Minimal Techno, Moombahton, Neo-Soul, Orchestral Score, Piano Ballad, Polka, Post-Punk, 60s Psychedelic Rock, Psytrance, R&B, Reggae, Reggaeton, Renaissance Music, Salsa, Shoegaze, Ska, Surf Rock, Synthpop, Techno, Trance, Trap Beat, Trip Hop, Vaporwave, Witch house, ...

気分/説明: Acoustic Instruments, Ambient, Bright Tones, Chill, Crunchy Distortion, Danceable, Dreamy, Echo, Emotional, Ethereal Ambience, Experimental, Fat Beats, Funky, Glitchy Effects, Huge Drop, Live Performance, Lo-fi, Ominous Drone, Psychedelic, Rich Orchestration, Saturated Tones, Subdued Melody, Sustained Chords, Swirling Phasers, Tight Groove, Unsettling, Upbeat, Virtuoso, Weird Noises, ...

これらはほんの一例です。Lyria RealTime は、これ以外にも多くのことができます。独自のプロンプトを試してみましょう。

ベスト プラクティス
クライアント アプリケーションは、スムーズな再生を保証するために、堅牢な音声バッファリングを実装する必要があります。これにより、ネットワーク ジッターと生成レイテンシのわずかな変動を考慮できます。
効果的なプロンプト:
わかりやすいラベルを付けます。ムード、ジャンル、楽器を説明する形容詞を使用します。
反復して徐々に舵取りします。プロンプトを完全に変更するのではなく、要素を追加または変更して、音楽をよりスムーズに変化させてみてください。
WeightedPrompt の重みを調整して、新しいプロンプトが進行中の生成にどの程度影響するかを調整します。
詳細な技術情報
このセクションでは、Lyria RealTime の音楽生成機能の使用方法について詳しく説明します。

yesye

制限事項
インストゥルメンタルのみ: モデルはインストゥルメンタル音楽のみを生成します。
安全性: プロンプトは安全フィルタによってチェックされます。フィルタをトリガーするプロンプトは無視されます。その場合、出力の filtered_prompt フィールドに説明が書き込まれます。
透かし: 出力音声には、Google の責任ある AI の原則に沿って、識別用の透かしが常に挿入されます。
