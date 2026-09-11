# Use a provider-agnostic AI SDK with Groq initially

The Instagram classification and response-generation service will use the Vercel AI SDK with `@ai-sdk/groq`, and validate structured model output with Zod. Groq is the initial provider for cost and latency, using configurable model `openai/gpt-oss-20b` because it supports strict structured outputs; the provider-agnostic boundary keeps a future provider or model change localized, and credentials remain server-only.
