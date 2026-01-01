/* eslint-disable no-console */
import "reflect-metadata";

import dotenv from "dotenv";

import { OpenAIEmbeddingsService } from "../OpenAIEmbeddings";
import { PostgresConnection } from "../PostgresConnection";

dotenv.config();

async function main(
	query: string,
	connection: PostgresConnection,
	embeddingsGenerator: OpenAIEmbeddingsService,
): Promise<void> {
	// Genera el embedding usando la API de OpenAI
	const embedding = await embeddingsGenerator.embedQuery(query);

	const results = await connection.sql`
		SELECT name
		FROM mooc.courses
		ORDER BY (embedding <=> ${embedding})
		LIMIT 3;
	`;

	console.log(`For the query "${query}" the results are:`, results);
}

const pgConnection = new PostgresConnection(
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	process.env.POSTGRES_HOST!,
	Number(process.env.POSTGRES_PORT),
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	process.env.POSTGRES_USER!,
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	process.env.POSTGRES_PASSWORD!,
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	process.env.POSTGRES_DB!,
);

// Configuración de OpenAI Embeddings usando API Key
const embeddingsGenerator = new OpenAIEmbeddingsService();

main(process.argv[2], pgConnection, embeddingsGenerator)
	.catch(console.error)
	.finally(async () => {
		await pgConnection.end();
		console.log("Done!");

		process.exit(0);
	});
