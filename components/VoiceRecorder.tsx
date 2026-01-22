"use client";

import { useState, useRef } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  const startRecording = async () => {
    try {
      setTranscript("音声トークンを取得中...");

      // バックエンドAPIからトークンを取得
      const response = await fetch("/api/speech-token");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "トークンの取得に失敗しました");
      }

      const { authToken, region } = data;

      // Speech SDK の設定
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        authToken,
        region
      );
      speechConfig.speechRecognitionLanguage = "ja-JP";

      // オーディオ設定（マイク入力）
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

      // 音声認識インスタンスを作成
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );
      recognizerRef.current = recognizer;

      // 音声合成用の設定（エコーバック用）
      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
      synthesizerRef.current = synthesizer;

      let recognizedText = "";

      // リアルタイムでの認識中テキスト
      recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          setTranscript(
            `【認識中】\n${recognizedText}${e.result.text}...`
          );
        }
      };

      // 認識完了時
      recognizer.recognized = async (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          // テキストが空の場合は処理をスキップ
          if (!e.result.text || e.result.text.trim() === "") {
            return;
          }
          
          recognizedText += e.result.text;
          setTranscript(`【音声入力】\n${recognizedText}\n\n【処理中】\nエージェントに問い合わせています...`);

          // Agent Service を呼び出し
          try {
            const agentResponse = await fetch("/api/agent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ text: e.result.text }),
            });

            const agentData = await agentResponse.json();

            if (!agentData.success) {
              throw new Error(agentData.error || "エージェントの応答取得に失敗しました");
            }

            const responseText = agentData.response;
            setTranscript(`【音声入力】\n${recognizedText}\n\n【エージェント応答】\n${responseText}\n\n【処理中】\n音声を再生しています...`);

            // エージェントの応答を音声合成で再生
            if (responseText && synthesizerRef.current) {
              synthesizerRef.current.speakTextAsync(
                responseText,
                (result) => {
                  if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                    setTranscript(`【音声入力】\n${recognizedText}\n\n【エージェント応答】\n${responseText}\n\n【完了】\n音声の再生が完了しました`);
                  }
                },
                (error) => {
                  console.error("音声合成エラー:", error);
                  setTranscript(`【音声入力】\n${recognizedText}\n\n【エージェント応答】\n${responseText}\n\n【エラー】\n音声再生に失敗しました: ${error}`);
                }
              );
            }
          } catch (error) {
            console.error("Agent Service エラー:", error);
            setTranscript(`【音声入力】\n${recognizedText}\n\n【エラー】\nエージェントの処理に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          setTranscript(`【音声入力】\n${recognizedText}\n\n【情報】\n音声が認識されませんでした`);
        }
      };

      // エラーハンドリング
      recognizer.canceled = (s, e) => {
        console.error("音声認識がキャンセルされました:", e);
        if (e.reason === SpeechSDK.CancellationReason.Error) {
          setTranscript(`【エラー】\n${e.errorDetails}`);
        }
        stopRecording();
      };

      // セッション停止時
      recognizer.sessionStopped = () => {
        stopRecording();
      };

      // 継続的な音声認識を開始
      recognizer.startContinuousRecognitionAsync(
        () => {
          setIsRecording(true);
          setTranscript("音声入力を開始しました。話しかけてください...");
        },
        (error) => {
          console.error("音声認識の開始エラー:", error);
          setTranscript(`【エラー】\n音声認識の開始に失敗しました: ${error}`);
        }
      );
    } catch (error) {
      console.error("音声認識の初期化エラー:", error);
      setTranscript(
        `【エラー】\n${error instanceof Error ? error.message : "音声認識の初期化に失敗しました"}`
      );
    }
  };

  const stopRecording = () => {
    if (recognizerRef.current && isRecording) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          setIsRecording(false);
          recognizerRef.current?.close();
          recognizerRef.current = null;
        },
        (error) => {
          console.error("音声認識の停止エラー:", error);
          setIsRecording(false);
        }
      );

      // 音声合成も停止
      if (synthesizerRef.current) {
        synthesizerRef.current.close();
        synthesizerRef.current = null;
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
      {/* マイクボタン */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleMicClick}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          } shadow-lg hover:shadow-xl`}
          aria-label={isRecording ? "録音停止" : "録音開始"}
        >
          {/* アニメーション効果 - 録音中のみ表示 */}
          {isRecording && (
            <>
              <span className="absolute w-32 h-32 rounded-full bg-red-500 opacity-75 animate-ping"></span>
              <span className="absolute w-40 h-40 rounded-full bg-red-500 opacity-50 animate-pulse"></span>
            </>
          )}
          
          {/* マイクアイコン */}
          <svg
            className="w-12 h-12 text-white relative z-10"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* ステータステキスト */}
      <div className="text-center mb-6">
        <p className={`text-lg font-semibold ${isRecording ? "text-red-400" : "text-gray-400"}`}>
          {isRecording ? "🔴 録音中" : "マイクをクリックして録音開始"}
        </p>
      </div>

      {/* テキストエリア - 音声入出力 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          音声入出力
        </label>
        <textarea
          value={transcript}
          readOnly
          className="w-full h-64 bg-gray-900 border border-gray-600 rounded-lg p-4 text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="音声入力と出力がここに表示されます..."
        />
      </div>
    </div>
  );
}
