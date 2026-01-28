/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
	DistanceStrategy,
	PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { Document } from "@langchain/core/documents";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";

async function main(
	vectorStorePromise: Promise<PGVectorStore>,
	llm: ChatOpenAI,
): Promise<void> {
	const directoryLoader = new DirectoryLoader("./codely", {
		".pdf": (path: string): PDFLoader =>
			new PDFLoader(path, {
				splitPages: true,
			}),
	});

	const documents = await directoryLoader.load();

	const formattedDocuments = await Promise.all(
		documents.map(async (document) => {
			const content = await llm.invoke(
				`
Resume el siguiente contenido en 3 frases siguiendo estas reglas:
 * Devuelve directamente el texto, no digas gracias ni nada por el estilo.
 * No digas lo siento.
 * No incluyas información que no esté en el texto.
 * Haz el resumen en castellano.
 * No digas que no tienes información, siempre puedes hacer un resumen.

El texto a resumir:
\`\`\`
${document.pageContent}
\`\`\`
`.trim(),
			);

			return new Document({
				pageContent: content.content as string,
				metadata: document.metadata,
			});
		}),
	);

	console.log(documents);

	const vectorStore = await vectorStorePromise;

	await vectorStore.addDocuments(formattedDocuments);
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
const llm = new ChatOpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	model: "gpt-4o-mini",
	temperature: 0.3,
});

main(vectorStore, llm)
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		console.log("Done!");

		process.exit(0);
	});
