/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

//import { DirectoryLoader } from "@langchain/community/document_loaders/fs/directory";
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";

async function main(vectorStorePromise: Promise<PGVectorStore>): Promise<void> {
	const directoryLoader = new DirectoryLoader("./codely", {
		".pdf": (path: string): PDFLoader => new PDFLoader(path),
	});

	const documents = await directoryLoader.load();
	console.log(`📄 Documentos cargados: ${documents.length}`);

	const vectorStore = await vectorStorePromise;
	await vectorStore.addDocuments(documents);
	await vectorStore.end();
}

const vectorStore = PGVectorStore.initialize(
	new OpenAIEmbeddings({
		apiKey: process.env.OPENAI_API_KEY,
		model: "text-embedding-3-large", // recomendado
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
	},
);

main(vectorStore)
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		console.log("Done!");
		process.exit(0);
	});
