# PRISM – website version

PRISM (Project Reporting, Insights, Scheduling & Management) as a normal website you run yourself.
Documents, technical docs, Gantt chart, task tracking, final report, Word / PDF / Excel downloads, and the AI assistant.

## The AI: no claude.ai and no API key needed

PRISM picks its AI automatically, in this order:

| AI | What you need | Quality |
|---|---|---|
| **Claude** | A Claude API key in `.env` (optional, paid per use) | Best: free-form questions, any wording |
| **Local AI (Ollama)** | Ollama installed on the same computer (free, offline) | Good: free-form, depends on the model |
| **PRISM built-in engine** | Nothing. Always on. | Planning, documents and the commands listed under *Help* |

The bottom of the left menu shows which one is answering (for example *AI: PRISM built-in engine*).

**The built-in engine** is part of PRISM itself. It works offline, with no key, no account and no cost, in all 7 languages. It can:
- build a full project from a topic: about 12 tasks with owners, durations and predecessors, a budget split, and all three documents
  (it recognises software, construction, engineering, events, marketing, research and general projects)
- answer status, risks, critical path, workload, finish date and "tell me about T5"
- add and update tasks: "Add a task Security review for Omar, 3 days, after T4", "Mark T3 done", "Set T5 to 60%", "Change owner of T2 to Lena"
- write documents: "Write the executive summary", "Write the whole technical document"
- start a new project: "Make a project for a library management system"
Type **help** in the chat to see the commands in the current language. For open-ended questions in any wording, add Ollama or Claude.

**Optional free local AI with Ollama** (better chat, still free and private):
1. Install Ollama from https://ollama.com (Windows or Mac).
2. Open a terminal / Command Prompt and run: `ollama pull qwen2.5:7b` (about 4.7 GB, one time). On a slower laptop use `qwen2.5:3b`.
3. Start PRISM as usual. It finds Ollama by itself and the menu shows *AI: Local AI (qwen2.5:7b)*.
To stay fast on a laptop, PRISM still uses the built-in engine for building projects and for the commands it knows (status, risks, add/update tasks, write sections). Only other questions go to the local model.

## Run a demo on your own computer (localhost)

1. Install **Node.js LTS** from https://nodejs.org (one time only).
2. Unzip this folder somewhere easy, like your Desktop.
3. Double-click the launcher:
   - **Windows:** `Start PRISM (Windows).bat`
   - **Mac:** `Start PRISM (Mac).command`. The first time, Mac may block it: right-click the file, choose **Open**, then **Open** again.
4. The first time, it asks for a Claude API key. **Just press Enter** to use the built-in AI. (It saves your answer in `.env`, so it only asks once.)
5. Your browser opens **http://localhost:3000** with PRISM. Keep the black window open during the demo. Close it to stop.

No Node.js? You can also just double-click **`index.html`**. Everything works with the built-in engine, straight from the file.

Tips for the demo:
- Change the language with the **Language** menu at the top left: English, العربية, हिन्दी, தமிழ், മലയാളം, Français, Español.
  The menus, documents, charts, downloads and the AI's answers all switch to that language.
- Use **+ New from topic** to build a full project live in front of your audience.
- The PDF and Excel downloads load a small library from the internet the first time, so keep Wi-Fi on for those.
- If port 3000 is busy, PRISM uses 3001, 3002 and so on. The window shows the address.
- To add a Claude key later, open `.env` in Notepad/TextEdit, or delete `.env` and start again.

## What's in this folder

| File | What it does |
|---|---|
| `index.html` | The whole PRISM app |
| `api/claude.mjs`, `api/status.mjs` | The small server functions for the AI (used on Vercel) |
| `lib/ai.mjs`, `lib/claude.mjs`, `lib/ollama.mjs` | Shared server code: picks Claude or Ollama, limits, access code |
| `api/sync.mjs`, `lib/sync.mjs` | Shared team projects (saved in the `data` folder, or in Upstash Redis on Vercel) |
| `manifest.webmanifest`, `sw.js`, `icon-*.png` | Let PRISM install as an app and open offline |
| `server.mjs` | The same server for any other Node host (Render, Railway, your own PC) |
| `vercel.json` | Lets AI requests run up to 5 minutes on Vercel |
| `.env.example` | The settings you need to fill in |
| `Start PRISM (Windows).bat` / `Start PRISM (Mac).command` | One-click local demo launchers |

## Share projects with your team

Click **⇪ Share with team** in the left menu, then **Copy team link** and send the link to your team. Everyone who opens it sees the same project, and changes from each person appear for the others within a few seconds. If two people edit at the same moment, PRISM merges both changes.

Where shared projects are stored:

- **On your own computer (Start PRISM) or with "Share online":** works by itself. Projects are saved in the `data` folder next to `server.mjs`. Your laptop must be on for teammates to see changes.
- **On Vercel:** open your project on vercel.com → **Storage** → **Create** → **Upstash for Redis** (free plan) → connect it to the project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. Then **Deployments → Redeploy**. The Share button appears after that.
- **On Netlify Drop or as a single file:** sharing is not available (there is no server). Use "Save project file" and send the file instead.

If you set `ACCESS_CODE`, teammates are asked for it once.

## Install PRISM as an app

On a website with https (Vercel, or the "Share online" link), Chrome and Edge show **⤓ Install PRISM app** in the left menu (or an install icon in the address bar). On iPhone, use Share → Add to Home Screen. The app opens in its own window and still opens without internet (AI and sharing need a connection).

## Putting PRISM online

Without a key, the online site uses the built-in engine, so you can skip Step 1 and leave out `ANTHROPIC_API_KEY`.

## Step 1 – Get a Claude API key (optional)

1. Go to https://platform.claude.com and sign in (or create an account).
2. Add a payment method under **Billing** and buy some credit (for example USD 5).
3. Open **Settings → API keys → Create key**. Copy the key (it starts with `sk-ant-`). Keep it private.

## Step 2 – Put the folder on GitHub

1. Create a free account at https://github.com and click **New repository** (for example `prism`). Make it **Private**.
2. Click **uploading an existing file** and drag in everything from this folder, including the `api` and `lib` folders.
3. Click **Commit changes**.

## Step 3 – Deploy on Vercel (free)

1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New → Project**, pick your `prism` repository and click **Import**.
3. Leave the framework preset as **Other**. Open **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = your key from Step 1 (skip it to use the built-in engine)
   - `ACCESS_CODE` = a code you choose (people type it once before using the AI)
4. Click **Deploy**. After a minute you get a link like `https://prism-yourname.vercel.app`. That's your PRISM.

To change settings later: Vercel → your project → **Settings → Environment Variables**, then **Deployments → Redeploy**.

### Optional settings

| Variable | Default | What it does |
|---|---|---|
| `CLAUDE_MODEL` | `claude-opus-5-5` | Which Claude model answers. `claude-sonnet-5-5` costs about half and is faster. |
| `CLAUDE_EFFORT` | `medium` | How hard Claude thinks: `low`, `medium`, `high`. Lower is faster and cheaper. |
| `ACCESS_CODE` | none | If empty, anyone with the link can use the AI on your credit. Setting it is strongly recommended. |

If Claude's safety filter declines a request, the server automatically retries it on Anthropic's recommended fallback model.

## Other ways to host

**Render / Railway / your own server:** create a Node web service from the same GitHub repository with start command
`npm start`, and set the same environment variables. Any host with Node 20 or newer works.

**On your own computer:** see *Run a demo on your own computer* at the top.

## Good to know

- **Data:** each person's projects are saved in their own browser. Use **Save project file (.json)** to back up or move a project to another computer.
- **Cost:** you pay Anthropic per use. A chat question usually costs a few cents. Building a full project from a topic makes 4 AI calls and may cost roughly USD 0.20–0.50 with the default model. These are estimates; check real spend under **Usage** at platform.claude.com.
- **Without an API key** everything works, including the AI, through PRISM's built-in engine (or Ollama if installed).
- Ollama settings (optional, in `.env`): `OLLAMA_MODEL` to pick a model, `OLLAMA_URL` if Ollama runs elsewhere, `OLLAMA_DISABLED=1` to turn it off.
