import { Browser } from "../src/browser/index.ts";
import { makeAgent } from "../src/agent/index.ts";
import { Inventory } from "../src/inventory/index.ts";
import { Logger } from "../src/utils/index.ts";

async function chartRoute(browser: Browser, inventory: Inventory) {
  const page = await browser.newPage();

  await page.goto("http://shop.junglegym.ai/");

  await page.browse("sign into the website. do not sign out", {
    inventory,
    maxTurns: 3,
  });
  await page.browse("navigate to home page", { maxTurns: 2 });

  await page.do("add a product to the cart");
  await page.browse("navigate to the checkout", { maxTurns: 4 });
  await page.browse("complete the checkout flow", { maxTurns: 5 });

  const pageId = page.pageId;
  await page.close();

  return pageId;
}

async function followRoute(
  browser: Browser,
  routeId: string,
  inventory: Inventory
) {
  const page = await browser.newPage({ inventory });

  await page.followRoute(routeId);
}

async function main() {
  const agent = makeAgent(
    { apiKey: process.env.OPENAI_API_KEY!, provider: "openai" },
    { model: "gpt-4" }
  );

  const inventory = new Inventory([
    { value: "emma.lopez@gmail.com", name: "email", type: "string" },
    { value: "Password.123", name: "Password", type: "string" },
  ]);

  const logger = new Logger(["info"], (msg) => console.log(msg));

  const browser = await Browser.launch(false, agent, logger);

  const routeId = await chartRoute(browser, inventory);
  await followRoute(browser, routeId, inventory);

  await browser.close();
}

main();
