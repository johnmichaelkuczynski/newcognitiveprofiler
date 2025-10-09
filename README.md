# 🧩 NEW COGNITIVE PROFILER

**NEW COGNITIVE PROFILER** is a multi-engine AI reasoning and text-analysis platform that evaluates written content for **cogency, coherence, originality, and cognitive depth**.  
It integrates multiple AI providers (Anthropic, DeepSeek, OpenAI, Perplexity) and unifies their outputs through robust JSON parsing, fallback logic, and proprietary comparative analysis.

---

## 🚀 Live Demo
👉 [https://www.cognitiveprofiler.xyz/](https://www.cognitiveprofiler.xyz/)

---

## 💡 Core Capabilities
- **Multi-Model Integration** — Combines outputs from Anthropic, DeepSeek, OpenAI, and Perplexity for composite reasoning.  
- **Cognitive Analysis Engine** — Scores essays, arguments, or creative works for clarity, logic, and originality.  
- **JSON-Safe Parsing Layer** — Custom logic introduces `JSON_START` markers and fallback handling to ensure stable multi-provider interoperability.  
- **Document Comparison** — Aligns and contrasts conceptual structures across multiple texts to detect reasoning patterns or originality gaps.  
- **Credit & Paywall System** — Stripe + Supabase integration enables soft paywall preview (~30 % of output free) before unlocking full analysis.  
- **Persistent Profiles** — Supabase-backed account system stores user history, metrics, and reports for long-term tracking.  
- **Dynamic Prompt Logic** — Context-sensitive routing of prompts to the provider best suited for each analytic task.

---

## 🧰 Tech Stack
| Layer | Technology |
|--------|-------------|
| Frontend | React (Vite) |
| Backend | Node / Express (TypeScript) |
| Database | Supabase |
| Payments | Stripe (Checkout + Webhooks) |
| AI Providers | Anthropic · DeepSeek · OpenAI · Perplexity |
| Deployment | Render / Replit |
| Auth | Supabase Auth |

---

## ⚙️ Installation
1. Clone the repo  
   ```bash
   git clone https://github.com/johnmichaelkuczynski/newcognitiveprofiler.git
   cd newcognitiveprofiler
   ```
2. Install dependencies  
   ```bash
   npm install
   ```
3. Create an `.env` file and include:  
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SUPABASE_URL=https://...
   SUPABASE_ANON_KEY=...
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=...
   DEEPSEEK_API_KEY=...
   PERPLEXITY_API_KEY=...
   ```
4. Run locally  
   ```bash
   npm run dev
   ```

---

## 🧠 Concept
**NEW COGNITIVE PROFILER** functions as both an *intelligence assessor* and a *cross-model synthesizer*.  
It fuses multiple LLM perspectives into a unified analytical report, quantifying argument quality, conceptual rigor, and stylistic clarity.  
By combining evaluation with real-time humanization logic, it produces reports indistinguishable from expert critique.

---

## 🧾 License
© 2025 **Zhi Systems / John-Michael Kuczynski**  All rights reserved.  

---

## 📬 Contact
For collaboration, licensing, or API integration:  
**John-Michael Kuczynski** — [GitHub Profile](https://github.com/johnmichaelkuczynski)
