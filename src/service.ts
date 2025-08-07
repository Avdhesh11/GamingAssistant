import {
    BedrockRuntimeClient,
    InvokeModelCommand, InvokeModelCommandOutput
} from "@aws-sdk/client-bedrock-runtime";
import {
    BedrockAgentRuntimeClient,
    RetrieveCommand,
    RetrieveCommandInput,RetrieveAndGenerateCommand
} from "@aws-sdk/client-bedrock-agent-runtime";
import {Document} from "mongodb";

export async function resolveQuery(req: any) {
    try {
        const query: string = req.body?.query;
        const type: number = Number(req.body?.type);
        const sessionId: string = req.body?.sessionId;
        let appConfig: any;
        console.log(`type - ${type}`);
        if (type == 1) {
            // appConfig = await AppConfigRepository.getAppConfig(`winzo_ignite`);
            return [];
        }
        const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
        const kbClient = new BedrockAgentRuntimeClient({ region: "us-east-1" });
        const knowledgeBaseId = "WRV2ZY8WYW";

        const input: RetrieveCommandInput = {
            knowledgeBaseId,
            retrievalConfiguration: {
                vectorSearchConfiguration: {
                    numberOfResults: 5,
                    overrideSearchType: "HYBRID"
                }
            },
            retrievalQuery: { text: query }
        };

        const initialResponse = await kbClient.send(new RetrieveCommand(input));
        const results = initialResponse.retrievalResults || [];

        const documents: Document[] = [];
        for (const result of results) {
            const content = result.content?.text || "";
            const score = result.score ?? 0;
            if (score >= 0.2) {
                documents.push({ page_content: content, metadata: result });
            }
        }

        const context = documents.map(doc => doc.page_content).join("\n\n");
        console.log("Retrieved Context:\n", context);

        const prompt = `You are only WinZO's Gaming assistant. Use the context below to answer the user's question. Context: ${context} \n Question: ${query}`;
        const body = JSON.stringify({
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000
        });

        const command = new InvokeModelCommand({
            modelId: "arn:aws:bedrock:us-east-1:241533147251:inference-profile/us.deepseek.r1-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body
        });

        const response: any = await bedrockClient.send(command);
        const responseBody = JSON.parse(Buffer.from(response?.body).toString());
        let result: string = responseBody.choices[0].message.content;
        if (!result) {
            result = "My brain just took a chai break :coffee:";
        }
        console.log(`result: ${JSON.stringify(result)}`);
        return {"data": [
                {"type": 0, "description": result}]
        };
    }
    catch(err: any) {
        console.log("ERROR: ", err)
        return "Something Went Wrong!!";
    }
}
