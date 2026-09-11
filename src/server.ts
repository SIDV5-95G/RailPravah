import { createApp } from './app.js';
import { env, isSupabaseConfigured, isGeminiConfigured } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚆 RailPravah Backend Server`);
  console.log(`📡 Listening on http://localhost:${env.PORT}`);
  console.log(`⚡ Environment: ${env.NODE_ENV}`);
  console.log(
    `🗄️  Supabase Status: ${
      isSupabaseConfigured() ? 'Connected (Remote)' : 'Active (Local Fallback Store Ready)'
    }`
  );
  console.log(
    `🧠 Google AI Studio Status: ${
      isGeminiConfigured() ? `Connected (${env.GEMINI_MODEL})` : 'Active (Heuristic Engine Ready)'
    }`
  );
  console.log(`====================================================`);
});

export default server;
