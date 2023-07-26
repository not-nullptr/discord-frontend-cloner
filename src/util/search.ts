import fs from "fs";
import { isMoreThan80PercentIdentical, isOfChunkType } from "./typeChecks";
import { Config } from "../types/env";
import { App } from "..";
import { JSDOM } from "jsdom";

export function getChunksFromJsFiles(app: App) {
	const result: { [key: number]: string }[] = [];
	if (fs.existsSync("potentialMatches.txt"))
		fs.rmSync("potentialMatches.txt");
	fs.readdirSync(`assets`)
		.filter((f) => f.endsWith(".js"))
		.forEach((f) => {
			const matches =
				fs
					.readFileSync(`assets/${f}`)
					.toString()
					.match(/(?<=^|[^\w.])\{[^{}]*\}(?=[^\w.])/gm) || [];

			matches.forEach((match) => {
				try {
					const obj = eval(`(${match})`);
					if (
						isOfChunkType(obj) &&
						!isMoreThan80PercentIdentical(Object.values(obj))
					) {
						result?.push(obj);
						return;
					}
				} catch {}
			});
		});
	return result || [];
}

export function getLinksFromChunks(chunks: { [key: number]: string }[]) {
	const result: string[] = [];
	chunks.forEach((chunk) =>
		result.push(
			...Object.values(chunk).map((chunk) => `/assets/${chunk}.js`),
		),
	);
	fs.writeFileSync("results.txt", result.toString());
	return result;
}

export function getLinksFromCssFiles(app: App) {
	const result: string[] = [];
	fs.readdirSync(`assets`)
		.filter((f) => f.endsWith(".css"))
		.forEach((f) => {
			const matches =
				fs
					.readFileSync(`assets/${f}`)
					.toString()
					.match(/url\((.*?)\)/gi) || [];

			const urlContents = matches.map((match) =>
				match.replace(/url\((.*?)\)/i, "$1"),
			);
			result.push(...urlContents.filter((u) => u.startsWith("/assets/")));
		});
	return result;
}

export function getLinksFromGeneralSearch(app: App) {
	const result: string[] = [];
	if (fs.existsSync("potentialMatches.txt"))
		fs.rmSync("potentialMatches.txt");
	fs.readdirSync(`assets`)
		.filter((f) => f.endsWith(".js"))
		.forEach((f) => {
			const file = fs.readFileSync(`assets/${f}`).toString();
			const regex =
				/"([a-fA-F0-9]{32}\.(svg|png|mp4|mp3|webm|ico|woff2|gif|mov|jpg|jpeg)")/gm;
			const matches = file.match(regex) || [];
			const urlContents = matches.map(
				(match) => `/assets/${match.replaceAll('"', "")}`,
			);
			result.push(...urlContents);
		});
	return result;
}

function replaceInQuotes(
	inputString: string,
	searchString: string,
	replaceString: string,
	type: "exact" | "loose",
) {
	const result = inputString.replace(
		/(['"])(.*?)\1/g,
		(match, quote, inside) => {
			if (type === "exact") {
				if (inside.trim() === searchString) {
					return `${quote}${replaceString}${quote}`;
				} else {
					return match;
				}
			} else {
				return `${quote}${inside.replace(
					new RegExp(searchString, "g"),
					replaceString,
				)}${quote}`;
			}
		},
	);
	return result;
}

export function performFindAndReplace(config: Config, app: App) {
	// js search
	const assets = fs.readdirSync(`assets`);
	assets
		.filter((f) => f.endsWith(".serve"))
		.forEach((f) => {
			fs.rmSync(`assets/${f}`);
		});
	assets
		.filter((f) => f.endsWith(".js"))
		.forEach((f) => {
			const contents = fs.readFileSync(`assets/${f}`).toString();
			let newContents = contents;
			config.patterns.forEach((p) => {
				newContents = replaceInQuotes(
					newContents,
					p.find,
					p.replace,
					p.type,
				);
			});
			if (contents === newContents) return;
			console.log(
				`Patterns found in ${f}! Writing to assets/${f}.serve...`,
			);
			fs.writeFileSync(`assets/${f}.serve`, newContents);
		});
	// html search
	const contents = fs.readFileSync(`apps/${app.name}/index.html`).toString();
	let newContents = contents;
	config.patterns.forEach((p) => {
		newContents = replaceInQuotes(newContents, p.find, p.replace, p.type);
	});
	const doc = new JSDOM(newContents);
	const document = doc.window.document;
	document.querySelectorAll("div,a,h1,h2,h3,h4,h5,h6,button").forEach((e) => {
		const el = e as HTMLElement;
		config.patterns.forEach((p) => {
			if (p.type === "loose") {
				el.innerText?.replaceAll(p.find, p.replace);
			} else {
				if (el.innerText === p.find) el.innerText = p.replace;
			}
		});
	});
	newContents = doc.serialize();
	if (contents === newContents) return;
	console.log(
		`Patterns found in HTML! Writing to apps/${app.name}/index.html.serve...`,
	);
	fs.writeFileSync(`apps/${app.name}/index.html.serve`, newContents);
}
