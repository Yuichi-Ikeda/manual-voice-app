# 指示
`実装例`を参考に、`必須ライブラリ`及び`実装手順`に従い NextJS アプリケーションを修正してください。

## 実装手順
1. バックエンド側に Microsoft Foundry の Agent Service を呼び出す API を実装してください。
2. バックエンド側の Agent Service の認証情報はマネージドIDを利用して、エンドポイントとエージェント名は .env ファイルから取得するようにしてください。
3. フロントエンド側の Azure Speech Service で音声認識が完了したら変換したテキストを入力値として Agent Service を呼び出してください。
4. Agent Service からの応答テキストを Azure Speech Service の音声合成 API で音声再生する機能も追加してください。

## 必須ライブラリ
- JavaScript 用の Azure AI Projects クライアント ライブラリ
  - パッケージ名: `@azure/ai-projects`
  - バージョン: `^2.0.0-beta.3`

## 実装例
```javaScript
import { DefaultAzureCredential } from "@azure/identity";
import { AIProjectClient } from "@azure/ai-projects";

const projectEndpoint = "https://ai-foundry-yuichii-japaneast.services.ai.azure.com/api/projects/firstProject-japaneast";
const agentName = "rav4-manual-agent";

// Create AI Project client
const projectClient = new AIProjectClient(projectEndpoint, new DefaultAzureCredential());

async function main() {
  // Retrieve Agent by name (latest version)
  const retrievedAgent = await projectClient.agents.get(agentName);
  console.log("Retrieved latest agent - name:", retrievedAgent.versions.latest.name, " id:", retrievedAgent.id);
  // Use the retrieved agent to create a conversation and generate a response
  const openAIClient = await projectClient.getOpenAIClient();
  // Create conversation with initial user message
  console.log("\nCreating conversation with initial user message...");
  const conversation = await openAIClient.conversations.create({
    items: [{ type: "message", role: "user", content: "What is the size of France in square miles?" }]
    });
  console.log("Created conversation with initial user message (id: ");
  console.log(conversation.id);
  
  // Generate response using the agent
  console.log("\nGenerating response...");
  const response = await openAIClient.responses.create(
      {
          conversation: conversation.id,
      },
      {
          body: { agent: { name: retrievedAgent.name, type: "agent_reference" } },
      },
  );
  console.log("Response output: ");
  console.log(response.output_text);
}

main();
```