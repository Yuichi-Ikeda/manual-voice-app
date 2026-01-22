import { NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";

export async function GET() {
  try {
    // 環境変数から設定を取得
    const speechEndpoint = process.env.AZURE_SPEECH_ENDPOINT;
    const speechResourceId = process.env.AZURE_SPEECH_RESOURCE_ID;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechEndpoint || !speechResourceId || !speechRegion) {
      console.error("環境変数が設定されていません:", {
        speechEndpoint: !!speechEndpoint,
        speechResourceId: !!speechResourceId,
        speechRegion: !!speechRegion,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Azure Speech Service の設定が不足しています。環境変数を確認してください。",
        },
        { status: 500 }
      );
    }

    // マネージドIDを使用してアクセストークンを取得
    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken(
      "https://cognitiveservices.azure.com/.default"
    );

    if (!tokenResponse || !tokenResponse.token) {
      return NextResponse.json(
        {
          success: false,
          error: "マネージドIDによる認証に失敗しました",
        },
        { status: 500 }
      );
    }

    // Speech SDK用の認証文字列を生成
    // 形式: aad#{resourceId}#{entraAccessToken}
    const authToken = `aad#${speechResourceId}#${tokenResponse.token}`;

    return NextResponse.json({
      success: true,
      authToken: authToken,
      region: speechRegion,
      expiresOn: tokenResponse.expiresOnTimestamp,
    });
  } catch (error) {
    console.error("Speech トークン取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "トークンの取得中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
