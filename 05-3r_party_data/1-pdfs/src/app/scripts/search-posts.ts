/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import {
	DistanceStrategy,
	PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { pull } from "langchain/hub";
import { PoolConfig } from "pg";

async function main(
	query: string,
	vectorStorePromise: Promise<PGVectorStore>,
): Promise<void> {
	const vectorStore = await vectorStorePromise;

	const ragChain = await createStuffDocumentsChain({
		llm: new ChatOpenAI({
			apiKey: process.env.OPENAI_API_KEY,
			model: "gpt-4o-mini",
			temperature: 0,
		}),
		prompt: await pull<ChatPromptTemplate>("rlm/rag-prompt"),
		outputParser: new StringOutputParser(),
	});

	const response = await ragChain.invoke({
		question: query,
		context: await vectorStore.asRetriever().invoke(query),
	});

	console.log(response);

	await vectorStore.end();
}

const vectorStore = PGVectorStore.initialize(
	new OpenAIEmbeddings({
		apiKey: process.env.OPENAI_API_KEY,
		model: "text-embedding-3-large",
	}),
	{
		postgresConnectionOptions: {
			type: "postgres",
			host: process.env.POSTGRES_HOST,
			port: Number(process.env.POSTGRES_PORT),
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
		} as PoolConfig,
		tableName: "mooc.posts",
		columns: {
			idColumnName: "id",
			contentColumnName: "content",
			metadataColumnName: "metadata",
			vectorColumnName: "embedding",
		},
		distanceStrategy: "cosine" as DistanceStrategy,
	},
);

main(process.argv[2], vectorStore)
	.catch(console.error)
	.finally(async () => {
		console.log("Done!");

		process.exit(0);
	});
