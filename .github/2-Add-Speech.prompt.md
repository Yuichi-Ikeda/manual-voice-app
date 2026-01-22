# 指示
以下の`実装手順`に従い NextJS アプリケーションを修正してください。

## 実装手順
1. バックエンド側の API を Azure Speech Service の一時アクセストークンを返す API として修正してください。
2. バックエンド側の Azure Speech Service の認証情報はマネージドIDを利用します。認証に必要な`エンドポイント`と`RESOURCE_ID`は .env ファイルから取得するようにしてください。
3. フロントエンド側でマイクのボタンが押されたら、バックエンド API を呼び出し Azure Speech Service の一時アクセストークンを取得してください。
4. 取得した一時アクセストークンを利用して、ブラウザのマイク入力から Azure Speech Service の音声認識 API に音声データを送信してテキスト変換を行ってください。
5. 変換されたテキストはテキストエリアに表示してください。
6. 変換されたテキストを Azure Speech Service の音声合成 API を利用してエコーボットのように、音声で再生する機能も追加してください。

## 注意事項
- Speech SDK を使用した Microsoft Entra 認証では、Speech SDK に渡す文字列が aad#{resourceId}#{entraAccessToken} 形式になる点が重要