import { NextRequest, NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

export async function POST(request: NextRequest) {
  try {
    // リクエストボディから入力テキストを取得
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "入力テキストが必要です" },
        { status: 400 }
      );
    }

    // 環境変数から設定を取得
    const projectEndpoint = process.env.AZURE_PROJECT_ENDPOINT;
    const agentName = process.env.AZURE_AGENT_NAME;

    if (!projectEndpoint || !agentName) {
      console.error("環境変数が設定されていません:", {
        projectEndpoint: !!projectEndpoint,
        agentName: !!agentName,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: "Azure Agent Service の設定が不足しています" 
        },
        { status: 500 }
      );
    }

    console.log("Agent Service に接続中...", {
      endpoint: projectEndpoint,
      agent: agentName,
    });

    // マネージドIDを使用してAI Project Clientを作成
    const credential = new DefaultAzureCredential();
    const projectClient = new AIProjectClient(projectEndpoint, credential);

    // エージェントを名前で取得（最新バージョン）
    console.log("エージェントを取得中:", agentName);
    const retrievedAgent = await projectClient.agents.get(agentName);
    console.log("エージェント取得成功:", {
      name: retrievedAgent.versions.latest.name,
      id: retrievedAgent.id,
    });

    // OpenAI クライアントを取得
    const openAIClient = await projectClient.getOpenAIClient();

    // ユーザーメッセージで会話を作成
    console.log("会話を作成中...");
    const conversation = await openAIClient.conversations.create({
      items: [
        {
          type: "message",
          role: "user",
          content: text,
        },
      ],
    });
    console.log("会話作成成功:", conversation.id);

    // エージェントを使用して応答を生成
    console.log("応答を生成中...");
    const response = await openAIClient.responses.create(
      {
        conversation: conversation.id,
      },
      {
        body: {
          agent: {
            name: retrievedAgent.name,
            type: "agent_reference",
          },
        },
      }
    );

    console.log("応答生成成功:", response.output_text);

    return NextResponse.json({
      success: true,
      response: response.output_text,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Agent Service エラー:", error);
    
    // エラーの詳細をログに記録
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("エラースタック:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Agent Service の呼び出し中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GETメソッドのサポート（オプション）
export async function GET() {
  return NextResponse.json({
    message: "Agent API is running",
    methods: ["POST"],
    description: "テキストをPOSTメソッドで送信してください",
    requiredEnvVars: ["AZURE_PROJECT_ENDPOINT", "AZURE_AGENT_NAME"],
  });
}
