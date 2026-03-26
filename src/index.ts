#!/usr/bin/env node

import prompts from "prompts";
import pc from "picocolors";
import path from "node:path";
import fs from "node:fs";
import { scaffold } from "./scaffold.js";
import { envCommand } from "./env.js";

const TEMPLATES = [
  { title: "SaaS Starter (Next.js + Clerk + Centrali)", value: "saas" },
  { title: "React + Vite", value: "react-vite" },
  { title: "Next.js", value: "nextjs" },
] as const;

type TemplateName = (typeof TEMPLATES)[number]["value"];

interface Options {
  projectName: string;
  template: TemplateName;
  typescript: boolean;
}

async function main() {
  // Handle subcommands
  if (process.argv[2] === "env") {
    return envCommand(process.argv.slice(3));
  }
  console.log();
  console.log(pc.bold(pc.blue("create-centrali-app")));
  console.log(pc.dim("Scaffold a new Centrali-powered app\n"));

  // Check if project name was passed as CLI arg
  const argName = process.argv[2];

  // Parse flags
  const args = process.argv.slice(2);
  const flagTemplate = args.find((a) => a.startsWith("--template="))?.split("=")[1] as TemplateName | undefined;
  const flagNoTs = args.includes("--no-typescript");

  const response = await prompts(
    [
      {
        type: argName && !argName.startsWith("-") ? null : "text",
        name: "projectName",
        message: "Project name:",
        initial: "my-centrali-app",
        validate: (v: string) =>
          /^[a-z0-9][a-z0-9._-]*$/i.test(v) || "Invalid project name",
      },
      {
        type: flagTemplate ? null : "select",
        name: "template",
        message: "Select a template:",
        choices: TEMPLATES.map((t) => ({ title: t.title, value: t.value })),
      },
      {
        type: flagNoTs ? null : "toggle",
        name: "typescript",
        message: "Use TypeScript?",
        initial: true,
        active: "Yes",
        inactive: "No",
      },
    ],
    {
      onCancel: () => {
        console.log(pc.red("\nCancelled."));
        process.exit(1);
      },
    },
  );

  const options: Options = {
    projectName: argName && !argName.startsWith("-") ? argName : response.projectName,
    template: flagTemplate ?? response.template,
    typescript: flagNoTs ? false : (response.typescript ?? true),
  };

  const targetDir = path.resolve(process.cwd(), options.projectName);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `Directory ${pc.yellow(options.projectName)} is not empty. Overwrite?`,
      initial: false,
    });
    if (!overwrite) {
      console.log(pc.red("Cancelled."));
      process.exit(1);
    }
  }

  console.log();
  console.log(`Creating ${pc.green(options.projectName)} with ${pc.cyan(options.template)} template...`);
  console.log();

  scaffold(options.projectName, options.template, options.typescript);

  console.log(pc.green("Done! ") + "Your project is ready.\n");
  console.log("Next steps:\n");
  console.log(`  ${pc.cyan(`cd ${options.projectName}`)}`);
  console.log(`  ${pc.cyan("npm install")}`);
  console.log();

  if (options.template === "saas") {
    console.log(`  ${pc.dim("# Set up your Centrali credentials:")}`);
    console.log(`  ${pc.cyan("npx create-centrali-app env")}`);
    console.log();
    console.log(`  ${pc.dim("# Create collections, compute functions, and triggers:")}`);
    console.log(`  ${pc.cyan("npm run setup")}`);
    console.log();
    console.log(`  ${pc.dim("# Start the app — auth works instantly (Clerk keyless mode):")}`);
    console.log(`  ${pc.cyan("npm run dev")}`);
  } else {
    console.log(`  ${pc.dim("# Set up your environment variables:")}`);
    console.log(`  ${pc.cyan("npx create-centrali-app env")}`);
    console.log();
    console.log(`  ${pc.dim("# Or configure manually — see .env.example")}`);
    console.log(`  ${pc.dim("# Create a publishable key: Console > ACCESS > Publishable Keys")}`);
    console.log();
    console.log(`  ${pc.cyan("npm run dev")}`);
  }

  console.log();
  console.log(`  ${pc.dim("# Ready to deploy? See DEPLOY.md for Vercel/Netlify instructions")}`);
  console.log();
  console.log(`Docs: ${pc.underline("https://docs.centrali.io")}`);
  console.log();
}

main().catch((err) => {
  console.error(pc.red("Error:"), err);
  process.exit(1);
});
