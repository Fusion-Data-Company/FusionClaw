#!/usr/bin/env npx tsx
/**
 * FusionClaw Onboarding Script
 * Interactive setup wizard for new installations
 *
 * Usage: npm run onboard
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as crypto from "crypto";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  amber: "\x1b[38;5;214m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

// ASCII Art Banner
const BANNER = `
${colors.amber}${colors.bright}
   ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
   ██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
   █████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
   ██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
   ██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
   ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
${colors.cyan}                       CLAW${colors.reset}

${colors.dim}   Your Business-in-a-Box for AI Agents${colors.reset}

`;

// Helper to generate API key
function generateApiKey(): string {
  return `fusionclaw_sk_live_${crypto.randomBytes(24).toString("base64url")}`;
}

// Helper to generate a random password
function generatePassword(): string {
  return crypto.randomBytes(18).toString("base64url");
}

// Helper to generate session secret
function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper to generate encryption key
function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Create readline interface
function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Ask a question
function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Print with color
function print(text: string, color: string = colors.reset) {
  console.log(`${color}${text}${colors.reset}`);
}

// Print success message
function success(text: string) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

// Print error message
function error(text: string) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

// Print info message
function info(text: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${text}`);
}

// Main onboarding flow
async function main() {
  console.clear();
  console.log(BANNER);

  const rl = createPrompt();
  const projectRoot = path.resolve(__dirname, "..");
  const envPath = path.join(projectRoot, ".env.local");

  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    print("\n  An existing .env.local file was found.", colors.amber);
    const overwrite = await ask(rl, `${colors.gray}  ? ${colors.reset}Overwrite existing configuration? (y/N): `);
    if (overwrite.toLowerCase() !== "y") {
      print("\n  Onboarding cancelled. Your existing configuration is unchanged.", colors.dim);
      rl.close();
      process.exit(0);
    }
    print("");
  }

  print("  Let's get your FusionClaw instance set up.\n", colors.dim);

  // ─── Database ───────────────────────────────────────────────────────────
  print("  " + "─".repeat(50), colors.dim);
  print("  DATABASE CONFIGURATION", colors.bright);
  print("  " + "─".repeat(50), colors.dim);

  const databaseUrl = await ask(
    rl,
    `\n${colors.gray}  ? ${colors.reset}Enter your Neon DATABASE_URL:\n${colors.dim}    (postgresql://user:pass@host/db?sslmode=require)${colors.reset}\n    > `
  );

  if (!databaseUrl.startsWith("postgresql://")) {
    error("  Invalid DATABASE_URL format. Should start with 'postgresql://'");
    rl.close();
    process.exit(1);
  }

  // ─── AI Services (optional) ─────────────────────────────────────────────
  print("\n  " + "─".repeat(50), colors.dim);
  print("  AI SERVICES (optional)", colors.bright);
  print("  " + "─".repeat(50), colors.dim);

  const openrouterKey = await ask(
    rl,
    `\n${colors.gray}  ? ${colors.reset}Enter your OpenRouter API key ${colors.dim}(optional, press Enter to skip)${colors.reset}:\n    > `
  );

  const falKey = await ask(
    rl,
    `\n${colors.gray}  ? ${colors.reset}Enter your fal.ai key ${colors.dim}(optional, press Enter to skip)${colors.reset}:\n    > `
  );

  // ─── Auth (OWNER_PASSWORD for deployed installs) ────────────────────────
  print("\n  " + "─".repeat(50), colors.dim);
  print("  AUTH (deployed installs only)", colors.bright);
  print("  " + "─".repeat(50), colors.dim);
  print(
    `\n${colors.dim}  When you run on localhost, no password is needed — you're trusted.${colors.reset}`
  );
  print(
    `${colors.dim}  When you deploy (Vercel, your own server), the /login page${colors.reset}`
  );
  print(
    `${colors.dim}  asks for OWNER_PASSWORD before letting anyone in.${colors.reset}`
  );

  const wantPassword = await ask(
    rl,
    `\n${colors.gray}  ? ${colors.reset}Set an OWNER_PASSWORD now? (Y/n, or 'gen' to generate one): `
  );

  let ownerPassword = "";
  const choice = wantPassword.toLowerCase();
  if (choice === "" || choice === "y" || choice === "yes") {
    ownerPassword = await ask(
      rl,
      `${colors.gray}  ? ${colors.reset}Enter password (or leave blank to skip and use localhost-only):\n    > `
    );
  } else if (choice === "gen" || choice === "generate") {
    ownerPassword = generatePassword();
    info(`Generated password: ${colors.cyan}${ownerPassword}${colors.reset}`);
    info(`(Copy it now — you'll need it to log in to deployed instances.)`);
  }

  // ─── Generate keys ──────────────────────────────────────────────────────
  const mcpApiKey = generateApiKey();
  const sessionSecret = generateSessionSecret();
  const encryptionKey = generateEncryptionKey();

  // ─── Build .env.local content ───────────────────────────────────────────
  const envContent = `# FusionClaw Configuration
# Generated by: npm run onboard
# Date: ${new Date().toISOString()}

# Neon PostgreSQL (use -pooler hostname for serverless/Vercel)
DATABASE_URL=${databaseUrl}

# OpenRouter (AI Chat / Humanizer)
OPENROUTER_API_KEY=${openrouterKey || "# Not configured — set later in Settings"}

# fal.ai (Image Generation)
FAL_KEY=${falKey || "# Not configured — set later in Settings"}

# Auth — leave OWNER_PASSWORD blank for localhost-only.
# Set it before deploying anywhere with a public URL.
OWNER_PASSWORD=${ownerPassword}
OWNER_EMAIL=
OWNER_NAME=

# Session signing secret (generated for you)
SESSION_SECRET=${sessionSecret}

# MCP Server (Agent Access)
# This key grants AI agents full platform access via Bearer token.
# Keep it secret — do not commit to git.
MCP_API_KEY=${mcpApiKey}

# Encryption key for user-supplied API keys stored in Settings
ENCRYPTION_KEY=${encryptionKey}

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

  // ─── Write file + push schema ───────────────────────────────────────────
  print("\n  " + "─".repeat(50), colors.dim);
  print("  SETTING UP YOUR INSTANCE", colors.bright);
  print("  " + "─".repeat(50) + "\n", colors.dim);

  try {
    fs.writeFileSync(envPath, envContent);
    success("Environment configured (.env.local created)");
  } catch (err) {
    error(`Failed to write .env.local: ${err}`);
    rl.close();
    process.exit(1);
  }

  info("Running database migration...");
  try {
    execSync("npx drizzle-kit push --force", {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    success("Database schema migrated");
  } catch (err) {
    error("Database migration failed. Check your DATABASE_URL.");
    info("You can run 'npm run db:push' manually after fixing the connection.");
  }

  // ─── Summary ────────────────────────────────────────────────────────────
  print("\n  " + "═".repeat(50), colors.amber);
  print(`${colors.green}${colors.bright}  Your FusionClaw instance is ready!${colors.reset}\n`);

  print(`  ${colors.bright}Your MCP API Key:${colors.reset}`);
  print(`  ${colors.cyan}${mcpApiKey}${colors.reset}\n`);
  print(`  ${colors.dim}Keep this secret. It grants full platform access to AI agents.${colors.reset}\n`);

  if (ownerPassword) {
    print(`  ${colors.bright}Your OWNER_PASSWORD:${colors.reset}`);
    print(`  ${colors.cyan}${ownerPassword}${colors.reset}\n`);
    print(`  ${colors.dim}Use this when logging into a deployed instance.${colors.reset}\n`);
  } else {
    print(`  ${colors.amber}⚠  No OWNER_PASSWORD set.${colors.reset}`);
    print(`  ${colors.dim}  This is fine for localhost development. Set one in .env.local${colors.reset}`);
    print(`  ${colors.dim}  before deploying anywhere with a public URL.${colors.reset}\n`);
  }

  print("  " + "─".repeat(50), colors.dim);
  print("  NEXT STEPS", colors.bright);
  print("  " + "─".repeat(50) + "\n", colors.dim);

  print(`  ${colors.bright}Start the web UI:${colors.reset}`);
  print(`  ${colors.cyan}  npm run dev${colors.reset}`);
  print(`  ${colors.dim}  → opens http://localhost:3000 (no login needed on localhost)${colors.reset}\n`);

  print(`  ${colors.bright}Build & start the MCP server (for AI agents):${colors.reset}`);
  print(`  ${colors.cyan}  npm run mcp:build && npm run mcp${colors.reset}\n`);

  print(`  ${colors.bright}Connect Claude Code:${colors.reset}`);
  print(`  ${colors.dim}  Add to ~/.claude/mcp_servers.json:${colors.reset}`);
  print(`  ${colors.cyan}  {
    "fusionclaw": {
      "command": "node",
      "args": ["${projectRoot}/mcp-server/dist/index.js"],
      "env": { "MCP_API_KEY": "${mcpApiKey}" }
    }
  }${colors.reset}\n`);

  print("  " + "═".repeat(50) + "\n", colors.amber);

  rl.close();
}

main().catch((err) => {
  console.error("Onboarding failed:", err);
  process.exit(1);
});
