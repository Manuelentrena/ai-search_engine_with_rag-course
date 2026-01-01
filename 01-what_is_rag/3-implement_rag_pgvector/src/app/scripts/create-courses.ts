/* eslint-disable no-console */
import "reflect-metadata";

import dotenv from "dotenv";

import { OpenAIEmbeddingsService } from "../OpenAIEmbeddings";
import { PostgresConnection } from "../PostgresConnection";

import jsonCourses from "./courses.json";

dotenv.config();

async function main(
	pgConnection: PostgresConnection,
	embeddingsGenerator: OpenAIEmbeddingsService,
): Promise<void> {
	await Promise.all(
		jsonCourses.map(async (jsonCourse) => {
			// Genera el embedding usando la API de OpenAI
			const embedding = await embeddingsGenerator.embedQuery(
				jsonCourse.name,
			);

			// Inserta en PostgreSQL
			await pgConnection.sql`
        INSERT INTO mooc.courses (id, name, embedding)
        VALUES (${jsonCourse.id}, ${jsonCourse.name}, ${JSON.stringify(embedding)});
      `;
		}),
	);
}

// Conexión a PostgreSQL usando variables de entorno
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

// Ejecutar script
main(pgConnection, embeddingsGenerator)
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await pgConnection.end();
		console.log("Done!");
		process.exit(0);
	});
