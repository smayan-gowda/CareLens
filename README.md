<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e499915a-68d1-4168-b798-9bb39313fc33

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Scan pipeline diagnostics

Saved assessment reports include a pipeline trace with per-photo metadata, selected model/version, retry attempts, JSON parsing and schema-validation outcomes, and report persistence status. The report's **Traceable Assessment Audit** panel displays this information. Failed analyses are stored as owner-scoped metadata in the Firestore `scanPipelineTraces` collection; deploy the updated `firestore.rules` for that collection to enable failure-trace retention.

Trace records contain photo IDs, capture labels, MIME types, byte sizes, SHA-256 fingerprints, and sanitized error codes—not image bytes, raw model responses, API keys, or source URLs. Images continue to follow the app's existing report-storage behavior.

Run the pipeline lifecycle and validation tests with:

`npx vitest run src/services/ai/aiUtils.test.ts src/services/ai/analysisValidation.test.ts src/services/ai/scanLifecycle.test.ts`
