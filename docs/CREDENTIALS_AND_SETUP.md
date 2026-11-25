# Credentials & Local Tools Setup Guide

This guide explains **where to find every required API key** for **The Monument That Lives in My Memory**, **where to store them safely**, and **what tools are already installed**.

---

## 1. Where to Store Your Keys Safely

Store all secrets in a local **`.env`** file inside the project root (`day-2-ai-content-generation/.env`):

1. Copy the template file:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `.env` and replace the placeholder values with your real keys.
3. **Never commit `.env` or `kaggle.json` to GitHub.** (`.gitignore` already ignores `.env`, `.env.*`, `*.key`, `*.pem`, and `kaggle.json`.)
4. Never paste real keys into `storyboard.json`, `runs.jsonl`, `EXPERIMENTS.md`, or `FAILURES.md`.

---

## 2. Where to Find Each API Key / Credential

### A. Google AI Studio / Gemini API (`GEMINI_API_KEY`)
Used for script refinement, Amharic Gemini TTS narration, and translation/helpers.

1. Open Google AI Studio (`https://aistudio.google.com/`) and sign in with your Google account.
2. Open **Get API key** -> **Create API key** (in a new or existing Google Cloud project).
3. Copy the key and store it in `.env`:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```

---

### B. Cloudflare Workers AI (`CLOUDFLARE_ACCOUNT_ID` & `CLOUDFLARE_API_TOKEN`)
Used for FLUX image generation (Step 6 reference sheets & Step 7 keyframes).

1. Sign in to the Cloudflare Dashboard (`https://dash.cloudflare.com/`).
2. **Find your Account ID:**
   - Look at the right sidebar on your Account Home / Workers & Pages overview, or open **AI -> Workers AI -> Use REST API**.
   - Copy the **Account ID** string into `.env` as `CLOUDFLARE_ACCOUNT_ID=...`.
3. **Create an API Token:**
   - Go to **My Profile -> API Tokens -> Create Token** (or click **Create a Workers AI API Token** inside **AI -> Workers AI -> Use REST API**).
   - Use the **Workers AI** template (or custom token with `Account -> Workers AI -> Edit`).
   - Copy the token immediately (it is shown only once) and store it in `.env` as `CLOUDFLARE_API_TOKEN=...`.

---

### C. Kaggle (`KAGGLE_USERNAME` & `KAGGLE_KEY` / `kaggle.json`)
Used for running **Wan 2.2** (video) and **ACE-Step** (original music) on Kaggle's free GPU quota (~30 hrs/week).

1. Sign in to Kaggle (`https://www.kaggle.com/`).
2. Open **Account / Settings** -> **Phone Verification** and verify your phone number (required to enable GPU notebooks).
3. Under **Settings -> API**, click **Create New Token** (downloads `kaggle.json` containing `"username"` and `"key"`).
4. Choose **either** storage method:
   - **Option 1 (Recommended in this project):** Put `KAGGLE_USERNAME=...` and `KAGGLE_KEY=...` into your local `.env` file.
   - **Option 2 (Standard Kaggle CLI path):** Place `kaggle.json` at `C:\Users\<YourWindowsUsername>\.kaggle\kaggle.json` (outside this Git repository).
   - *(Note: You can also run Wan 2.2 and ACE-Step directly inside Kaggle's browser notebook UI without using the CLI.)*

---

## 3. Local Tools Status

### Installed in Python
- **`imageio-ffmpeg 0.8.1`** (bundles `ffmpeg 9.0.2-essentials_build` for Python pipeline scripts via `imageio_ffmpeg.get_ffmpeg_exe()`)
- **`pytest 9.2.0`** (run tests with `pytest -v`)
- **`kaggle 2.2.5`** (Kaggle CLI / API client)
- **`google-genai 2.10.0`**, **`jsonschema 4.26.0`**, **`python-dotenv 1.2.2`**, **`requests 2.32.5`**, **`httpx 0.28.1`**, **`pillow 12.3.0`**

### Optional: System-Wide `ffmpeg` + `ffprobe` on Windows `PATH`
`imageio-ffmpeg` provides `ffmpeg` for Python scripts, but does not add global `ffmpeg` / `ffprobe` commands to Windows `PATH`. If you also want `ffmpeg` and `ffprobe` available directly in PowerShell:

- **Option 1 (`winget` in your PowerShell terminal):**
  ```powershell
  winget install --id Gyan.FFmpeg --exact
  ```
  Then open a new PowerShell window and run `ffmpeg -version` and `ffprobe -version`.
- **Option 2 (Manual zip from Gyan.dev):**
  1. Download `ffmpeg-release-essentials.zip` from `https://www.gyan.dev/ffmpeg/builds/`.
  2. Extract it to `C:\ffmpeg\`.
  3. Add `C:\ffmpeg\bin` to your Windows User `PATH` (*Edit environment variables for your account*).
