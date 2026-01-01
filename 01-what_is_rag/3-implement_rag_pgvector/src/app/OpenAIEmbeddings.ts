import "reflect-metadata";

// eslint-disable-next-line import/no-unresolved
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

export class OpenAIEmbeddingsService {
	private readonly embeddings: OpenAIEmbeddings;

	constructor() {
		if (!process.env.OPENAI_API_KEY) {
			throw new Error("OPENAI_API_KEY is required in .env");
		}

		this.embeddings = new OpenAIEmbeddings({
			apiKey: process.env.OPENAI_API_KEY,
			model: "text-embedding-3-small", // o el modelo de embeddings que prefieras
		});
	}

	async embedQuery(text: string): Promise<number[]> {
		const embedding = await this.embeddings.embedQuery(text);

		return embedding;
	}

	async embedDocuments(texts: string[]): Promise<number[][]> {
		const embeddings = await this.embeddings.embedDocuments(texts);

		return embeddings;
	}
}
