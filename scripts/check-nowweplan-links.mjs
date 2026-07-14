// Validates Hurricane Coast's NowWePlan feeder-link contract.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedScenarios = new Set(["hurricane", "outage"]);
const hurricaneLink = "https://nowweplan.com/start?src=hurricanecoast&scenario=hurricane";
const expected = new Map([
  ["index.html", hurricaneLink],
  ["kits.html", hurricaneLink],
  ["evacuation-kit.html", hurricaneLink],
  ["food-water-kit.html", hurricaneLink],
  ["pet-kit.html", hurricaneLink],
  ["senior-medical-kit.html", hurricaneLink],
  ["baby-child-kit.html", hurricaneLink],
  ["documents-kit.html", hurricaneLink],
  ["first-aid-kit.html", hurricaneLink],
  ["car-kit.html", hurricaneLink],
  ["power-outage-kit.html", "https://nowweplan.com/start?src=hurricanecoast&scenario=outage"],
]);

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(absolute)));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
}

const errors = [];
const linksByFile = new Map();

for (const file of await htmlFiles(root)) {
  const relative = path.relative(root, file);
  const html = await readFile(file, "utf8");
  const links = [...html.matchAll(/href=["'](https?:\/\/nowweplan\.com\/start(?:\?[^"']*)?)["']/g)].map(
    (match) => match[1].replaceAll("&amp;", "&")
  );
  if (links.length > 0) linksByFile.set(relative, links);

  for (const link of links) {
    const url = new URL(link);
    const parameterNames = [...url.searchParams.keys()];
    if (url.origin !== "https://nowweplan.com" || url.pathname !== "/start") {
      errors.push(`${relative}: unexpected NowWePlan destination ${link}`);
    }
    if (url.searchParams.get("src") !== "hurricanecoast") {
      errors.push(`${relative}: NowWePlan link must use src=hurricanecoast`);
    }
    if (parameterNames.some((name) => name !== "src" && name !== "scenario")) {
      errors.push(`${relative}: NowWePlan links may contain only src and scenario`);
    }
    const scenario = url.searchParams.get("scenario");
    if (!scenario || !allowedScenarios.has(scenario)) {
      errors.push(`${relative}: unsupported or missing NowWePlan scenario ${scenario ?? "(none)"}`);
    }
    if (relative.startsWith(`es${path.sep}`)) {
      errors.push(`${relative}: Spanish pages must not promote the English-only NowWePlan flow`);
    }
  }
}

for (const [file, links] of linksByFile) {
  const expectedLink = expected.get(file);
  if (!expectedLink) {
    errors.push(`${file}: unexpected NowWePlan link placement`);
  } else if (links.length !== 1 || links[0] !== expectedLink) {
    errors.push(`${file}: expected exactly ${expectedLink}`);
  }
}

for (const [file, link] of expected) {
  if (!linksByFile.has(file)) errors.push(`${file}: missing ${link}`);
}

if (errors.length > 0) {
  throw new Error(`NowWePlan link contract failed:\n${errors.join("\n")}`);
}

const linkCount = [...linksByFile.values()].reduce((total, links) => total + links.length, 0);
console.log(`Validated ${linkCount} NowWePlan links across ${linksByFile.size} Hurricane Coast pages.`);
