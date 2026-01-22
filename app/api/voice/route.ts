import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // FormDataから音声データを取得
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "音声ファイルが見つかりません" },
        { status: 400 }
      );
    }

    // 音声ファイルの情報をログ出力
    console.log("受信した音声ファイル:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    // ここで実際の音声処理を行う
    // 例: 音声認識API（Azure Speech、Google Speech-to-Text等）に送信
    // この例では、ダミーレスポンスを返します
    
    // 音声データをArrayBufferとして読み込む（必要に応じて）
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log("音声データサイズ:", buffer.length, "bytes");

    // ダミーレスポンス
    // 実際のアプリケーションでは、ここで音声認識APIを呼び出します
    const mockTranscript = "こんにちは、これは音声入力のテストです。";
    const mockOutput = "音声処理が完了しました。入力された音声を正常に受信しました。";

    return NextResponse.json({
      success: true,
      message: "音声ファイルを正常に受信しました",
      transcript: mockTranscript,
      output: mockOutput,
      fileInfo: {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size,
      },
    });
  } catch (error) {
    console.error("音声処理エラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "音声処理中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GETメソッドのサポート（オプション）
export async function GET() {
  return NextResponse.json({
    message: "Voice API is running",
    methods: ["POST"],
    description: "音声ファイルをPOSTメソッドで送信してください",
  });
}
