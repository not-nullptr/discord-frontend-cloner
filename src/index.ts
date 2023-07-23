import { JSDOM } from "jsdom";
import simpleGit from "simple-git";
import fs from "fs";
import { GlobalEnv } from "./types/env";
import prettier from "prettier";
import { sleep, fetchLinks } from "./util/download";
import {
	getLinksFromCssFiles,
	getChunksFromJsFiles,
	getLinksFromGeneralSearch,
	getLinksFromChunks,
} from "./util/search";
import { validate } from "./util/typeChecks";
import { runNodeApp } from "./util/exec";
import dotenv from "dotenv";

dotenv.config();

async function generateDiscordHtml(doc: JSDOM) {
	const document = doc.window.document;
	const envScript = document.querySelector("head")!.querySelector("script")!;
	//    vvvv    we do this so this tool can constantly stay up-to-date with discord's shit
	const envReference = eval(
		`(${envScript.innerHTML
			.replace("window.GLOBAL_ENV = ", "")
			.slice(0, -1)})`,
	) as GlobalEnv;
	const globalEnv = JSON.parse(
		fs.readFileSync("config.json").toString(),
	) as GlobalEnv;
	if (!validate(globalEnv, envReference)) {
		console.log("Invalid config! Are you missing a key?");
		process.exit(1);
	}
	envScript.innerHTML = `window.GLOBAL_ENV = ${JSON.stringify(globalEnv)}`;
	document
		.querySelectorAll("link")
		.forEach((e) => e.removeAttribute("integrity"));
	document
		.querySelectorAll("script")
		.forEach((e) => e.removeAttribute("integrity"));
	fs.writeFileSync(
		"./discord/index.html",
		await prettier.format(doc.serialize(), {
			tabWidth: 2,
			useTabs: true,
			parser: "html",
		}),
	);
}

(async () => {
	if (!fs.existsSync("discord")) {
		const git = simpleGit("");
		await git.clone(
			"https://github.com/not-nullptr/discord-selfhosting-guide",
			"discord",
		);
	}
	const doc = new JSDOM(
		await (await fetch("https://discord.com/login")).text(),
	);
	const document = doc.window.document;
	await generateDiscordHtml(doc);
	console.log(
		"Generated Discord HTML based off config.json at ./discord/index.html. The assets will be downloaded next.",
	);
	if (!fs.existsSync("./discord/assets")) fs.mkdirSync("./discord/assets");
	await sleep(2000);
	console.log("Downloading base assets from index.html (links & scripts)");
	await sleep(500);
	const links = [
		...Array.from(document.querySelectorAll("link")).map(
			(link) => link.href,
		),
		...Array.from(document.querySelectorAll("script")).map(
			(script) => script.src,
		),
	];
	await fetchLinks(links);
	console.log(
		"Base assets have finished! A deep scan of these assets for asset chunks will now occur.",
	);
	await fetchLinks(getLinksFromCssFiles());
	console.log("Finished downloading assets from CSS files.");
	// console.log(getChunksFromJsFiles());
	await fetchLinks(getLinksFromChunks(getChunksFromJsFiles()));
	console.log("Finished downloading JS chunks.");
	await fetchLinks(getLinksFromGeneralSearch());
	console.log("All done! Running the server.");
	const exitCode = await runNodeApp("discord");
	process.exit(exitCode || 0);
})();
