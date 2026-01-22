import VoiceRecorder from "@/components/VoiceRecorder";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-100">
          音声入力アプリケーション
        </h1>
        <VoiceRecorder />
      </div>
    </main>
  );
}
