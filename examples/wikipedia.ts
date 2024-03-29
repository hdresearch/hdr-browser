import yargs from "yargs/yargs";
import { z } from "zod";

import { AgentBrowser } from "../src/agentBrowser";
import { Logger } from "../src/utils";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { completionApiBuilder } from "../src/agent/config";

import { ModelResponseSchema } from "../src/types/browser/actionStep.types";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
  objective: { type: "string" },
  startUrl: { type: "string" },
  maxIterations: { type: "number", default: 10 },
});

async function main() {
  const argv = await parser.parse();
  console.log(argv);

  if (!argv.startUrl) {
    throw new Error("url is not provided");
  }

  if (!argv.objective) {
    throw new Error("objective is not provided");
  }

  const providerOptions = {
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
  };
  const logger = new Logger("info");
  const chatApi = completionApiBuilder(providerOptions, { model: "gpt-4" });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`
    );
  }
  const agent = new Agent(chatApi);
  const browser = await Browser.create(argv.headless);

  const agentBrowser = new AgentBrowser(agent, browser, logger);

  const wikipediaAnswer = ModelResponseSchema.extend({
    numberOfEditors: z
      .number()
      .int()
      .optional()
      .describe("The number of editors in int format"),
  });
  const answer = await agentBrowser.browse(
    {
      startUrl: argv.startUrl,
      objective: [argv.objective],
      maxIterations: argv.maxIterations,
    },
    wikipediaAnswer
  );

  console.log("Answer:", answer?.result);

  await agentBrowser.close();
}

main();
