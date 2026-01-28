/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

import {
	DistanceStrategy,
	PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
	RunnablePassthrough,
	RunnableSequence,
} from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { pull } from "langchain/hub";
import { PoolConfig } from "pg";

function formatDocumentsAsString(docs: Document[]): string {
	return docs.map((doc) => doc.pageContent).join("\n\n");
}

async function main(
	query: string,
	vectorStorePromise: Promise<PGVectorStore>,
): Promise<void> {
	const vectorStore = await vectorStorePromise;

	const declarativeRagChain = RunnableSequence.from([
		{
			context: vectorStore.asRetriever().pipe(formatDocumentsAsString),
			question: new RunnablePassthrough(),
		},
		await pull<ChatPromptTemplate>("rlm/rag-prompt"),
		new ChatOpenAI({
			apiKey: process.env.OPENAI_API_KEY,
			model: "gpt-4o-mini",
			temperature: 0,
		}),
		new StringOutputParser(),
	]);

	const response = await declarativeRagChain.invoke(query);

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
