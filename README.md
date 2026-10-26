# CareLens

CareLens helps people review home accessibility and safety through room photos. It organizes observations, possible concerns, and suggested improvements in one place.

> **Important:** CareLens provides preliminary, AI-assisted information. It is not a professional inspection or medical assessment. Photo-based findings may be wrong or incomplete, and image measurements do not establish real-world distances or clearances. Verify concerns in person.

## Features

- Organize homes, rooms, photos, and assessments.
- Analyze room photos to identify visible objects and possible safety or accessibility concerns.
- Review image annotations and spatial relationships between detected objects.
- Track findings, recommendations, and changes over time.
- Create improvement plans and search for local resources when live lookup is available.

## Run locally

**Requirements:** Node.js and npm. A Gemini API key is needed for live AI scans.

1. Clone the repository and open its folder:

   ```bash
   git clone https://github.com/smayan-gowda/CareLens.git
   cd CareLens1. Install dependencies:


Bash






```
npm install

```

2. Copy `.env.example` to `.env.local` and add your Gemini API key:


Dotenv






```
GEMINI_API_KEY=your_gemini_api_key

```





Keep API keys private; do not commit them to the repository.

3. Start CareLens:


Bash






```
npm run dev

```

4. Open [http://localhost:3000](http://localhost:3000).



On Windows PowerShell, use `npm.cmd` if `npm` is not recognized.


## Useful commands


Bash






```
npm run lint      # Type-check the project
npx vitest run    # Run tests
npm run eval      # Run the spatial-analysis evaluation
npm run build     # Build the app
npm start         # Start the built app
```
