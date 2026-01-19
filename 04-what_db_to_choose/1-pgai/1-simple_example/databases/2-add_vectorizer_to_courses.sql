SELECT ai.create_vectorizer(
	'mooc.courses'::regclass,
	embedding => ai.embedding_openai('text-embedding-3-small', 768, api_key_name=>'OPENAI_API_KEY'),
	chunking => ai.chunking_character_text_splitter('summary', 128, 10),
	formatting => ai.formatting_python_template('Name: $name | Summary: $chunk | Categories: $categories')
);
