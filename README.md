# Resume Analyzer

An AI resume analyzer built with HTML5, CSS3, Bootstrap 5, JavaScript, Node.js and Express.js. It scores a resume out of 100, lists strengths and weaknesses, checks keywords against a job description, and suggests fixes.

## Structure

```
resume-analyzer/
├── server.js        Express server and /api/analyze endpoint
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## Setup

1. `npm install`
2. Set your key (optional):
   - macOS / Linux: `export ANTHROPIC_API_KEY=your_key`
   - Windows CMD: `set ANTHROPIC_API_KEY=your_key`
   - PowerShell: `$env:ANTHROPIC_API_KEY="your_key"`
3. `npm start`
4. Open http://localhost:3000

Requires Node.js 18 or later.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Enables the AI analysis |
| `MODEL` | `claude-sonnet-5-5` | Claude model to use |
| `PORT` | `3000` | Server port |

## Offline mode

Without an API key, a rule-based review runs instead. It checks sections, contact email, action verbs, measurable results, length, and job-description keywords.

## Notes

- Input is pasted text or a `.txt` / `.md` file. PDF and Word upload would need extra packages such as `multer` and `pdf-parse`.
- Resumes are sent to the Claude API only when a key is set. Nothing is stored.

## Deploying (Render)

Build command `npm install`, start command `npm start`, and add `ANTHROPIC_API_KEY` under Environment.

## Troubleshooting

- **Cannot GET /**: keep `index.html` inside `public/`.
- **Analysis fails**: check the API key and that the server is running.
- Open the app at http://localhost:3000, not by double-clicking `index.html`.
