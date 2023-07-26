import { JSDOM } from "jsdom";
import simpleGit from "simple-git";
import fs from "fs";
import { Config, GlobalEnv } from "./types/env";
import prettier from "prettier";
import { sleep, fetchLinks } from "./util/download";
import {
	getLinksFromCssFiles,
	getChunksFromJsFiles,
	getLinksFromGeneralSearch,
	getLinksFromChunks,
	performFindAndReplace,
} from "./util/search";
import { validate } from "./util/typeChecks";
import { runNodeApp } from "./util/exec";
import dotenv from "dotenv";

export interface App {
	url: string;
	name: string;
	port: number;
}

const apps: App[] = [
	{
		url: "https://discord.com/login",
		name: "discord",
		port: 3000,
	},
	{
		url: "https://discord.com/developers",
		name: "devportal",
		port: 3001,
	},
	{
		url: "https://discord.com",
		name: "home",
		port: 3002,
	},
];

const config = JSON.parse(fs.readFileSync("config.json").toString()) as Config;

async function generateDiscordHtml(doc: JSDOM, app: App) {
	const document = doc.window.document;
	const envScript = Array.from(document.querySelectorAll("script")).find(
		(s) => s.innerHTML.startsWith("window.GLOBAL_ENV ="),
	); // we do this so this tool can constantly stay up-to-date with discord's shit
	if (!envScript) throw new Error("GLOBAL_ENV not found!");
	const envReference = eval(
		`(${envScript.innerHTML
			.replace("window.GLOBAL_ENV = ", "")
			.slice(0, -1)})`,
	) as GlobalEnv;
	envScript.innerHTML = `window.GLOBAL_ENV = ${JSON.stringify({
		...envReference,
		...config.GLOBAL_ENV,
	})}`;
	document
		.querySelectorAll("link")
		.forEach((e) => e.removeAttribute("integrity"));
	document
		.querySelectorAll("script")
		.forEach((e) => e.removeAttribute("integrity"));
	fs.writeFileSync(
		`apps/${app.name}/index.html`,
		await prettier.format(doc.serialize(), {
			tabWidth: 2,
			useTabs: true,
			parser: "html",
		}),
	);
}

(async () => {
	if (!fs.existsSync("apps")) fs.mkdirSync("apps");
	for (const app of apps) {
		if (!fs.existsSync(`apps/${app.name}`)) {
			const git = simpleGit("");
			await git.clone(
				"https://github.com/not-nullptr/discord-selfhosting-guide",
				`apps/${app.name}`,
			);
		}
		await simpleGit(`apps/${app.name}`).pull();
		const doc = new JSDOM(await (await fetch(app.url)).text());
		const document = doc.window.document;
		await generateDiscordHtml(doc, app);
		console.log(
			`Generated Discord HTML based off config.json at ./${app.name}/index.html. The assets will be downloaded next.`,
		);
		if (!fs.existsSync(`assets`)) fs.mkdirSync(`assets`);
		await sleep(2000);
		console.log(
			"Downloading base assets from index.html (links & scripts)",
		);
		await sleep(500);
		const links = [
			...Array.from(document.querySelectorAll("link"))
				.map((link) => link.href)
				.filter((link) => link.startsWith("/assets/")),
			...Array.from(document.querySelectorAll("script"))
				.map((script) => script.src)
				.filter((script) => script.startsWith("/assets/")),
		];
		await fetchLinks(links, app);
		console.log(
			"Base assets have finished! A deep scan of these assets for asset chunks will now occur.",
		);
		await fetchLinks(getLinksFromCssFiles(app), app);
		console.log("Finished downloading assets from CSS files.");
		// console.log(getChunksFromJsFiles());
		await fetchLinks(getLinksFromChunks(getChunksFromJsFiles(app)), app);
		console.log("Finished downloading JS chunks.");
		await fetchLinks(getLinksFromGeneralSearch(app), app);
		console.log("Finding and replacing patterns...");
		performFindAndReplace(config, app);
		console.log("All done! Running the server.");
		runNodeApp(`apps/${app.name}`, app.port);
	}
})();
