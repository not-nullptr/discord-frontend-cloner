import fs from "fs";
import { isMoreThan80PercentIdentical, isOfChunkType } from "./typeChecks";
import { Config } from "../types/env";
import { App } from "..";

export function getChunksFromJsFiles(app: App) {
	let result: { [key: number]: string } | undefined;
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
				if (match.length > 3000)
					try {
						const obj = eval(`(${match})`);
						if (
							isOfChunkType(obj) &&
							!isMoreThan80PercentIdentical(Object.values(obj))
						) {
							result = obj;
							return;
						}
					} catch {}
			});
		});
	return result || [];
}

export function getLinksFromChunks(chunks: { [key: number]: string }) {
	return Object.values(chunks).map((chunk) => `/assets/${chunk}.js`);
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
				/"([a-fA-F0-9]{32}\.(svg|png|mp4|mp3|webm|ico|woff2)")/gm;
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
		/(['"`])(.*?[^\\])\1/g,
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
	const assets = fs.readdirSync(`assets`);
	assets
		.filter((f) => f.endsWith(".serve"))
		.forEach((f) => {
			fs.rmSync(`assets/${f}`);
		});
	assets
		.filter((f) => f.endsWith(".js"))
		.forEach((f) => {
			let patternCount = 0;
			const contents = fs.readFileSync(`assets/${f}`).toString();
			let newContents = contents;
			config.patterns.forEach((p) => {
				patternCount++;
				newContents = replaceInQuotes(
					newContents,
					p.find,
					p.replace,
					p.type,
				);
			});
			if (contents === newContents) return;
			console.log(
				`${patternCount} pattern${
					patternCount !== 1 ? "s" : ""
				} found in ${f}! Writing to ${app.name}/assets/${f}.serve...`,
			);
			fs.writeFileSync(`assets/${f}.serve`, newContents);
		});
}
