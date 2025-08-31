# AI Task UI (Static Frontend)

A lightweight **HTML/CSS/JS** frontend for the *AI Task API*. It works on any static host (e.g., **GitHub Pages**) and talks directly to the single-route backend.

- Select **task** (qa • content • image • latest_answer)
- Fill inputs (**prompt**, **platform**, **image_size**, **use_mcp**, **user_id**)
- Press **Send** → see the **answer** or **image** inline, with **sources** and **raw JSON**
- API base defaults to your live URL: `https://ai-task-api.onrender.com`

---

## Features
- **Single page** UI, no build tools
- **Q&A** with optional **MCP** web search
- **Platform content** generator (LinkedIn/Twitter/etc.)
- **Image** generation: shows **exact resolution**, link + preview
- **Latest answer** retrieval by `user_id`
- **Error handling:** concise one‑line message from server (e.g., “user_id is required”)

---

## Quick Start (local)
1. Clone or download this folder
2. Open **`index.html`** in your browser *(or serve with any static server)*
3. Ensure the **API Base URL** is `https://ai-task-api.onrender.com` (default), click **Ping**
4. Choose a **task**, fill fields, and **Send**

> For **GitHub Pages**, push this folder to a public repo (e.g., `ai-task-ui`) and enable Pages → **Branch: main** → **/root**.

---

## Usage Notes
- **qa**: provide a **prompt**; toggle **use_mcp** for grounded answers with links.
- **content**: provide **prompt** + choose **platform** (LinkedIn, Twitter, etc.).
- **image**: provide **prompt** and **image_size** (e.g., `1024x1024`); preview scales to exact size.
- **latest_answer**: set **user_id** used in prior `qa` calls.

**Errors**: If something fails (e.g., missing `user_id`), a single red message appears beside **Send** and the same text shows in the **Result** box; expand **Raw JSON** for details.

---

## Files
```
index.html    # UI markup
styles.css    # Minimal styling (dark)
script.js     # API calls, rendering, error handling
README.md     # This file
```

---

## Security
This is **client-side only**—no secrets are stored here. The backend enables CORS and exposes only `POST /ai-task`. If you fork to another domain, update the API base if needed.
