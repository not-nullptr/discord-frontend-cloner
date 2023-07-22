import fs from "fs";
import https from "https";
import { plaintext } from "./typeChecks";

export function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

export function downloadBinaryAsset(path: string) {
	let client = https;
	return new Promise<void>((resolve, reject) => {
		const req = client.get(`https://discord.com${path}`, (res) => {
			res.pipe(fs.createWriteStream(`./discord${path}`))
				.on("error", reject)
				.once("close", () => resolve());
		});

		req.on("error", (err) => {
			// Handle the error here
			reject(err);
		});
	});
}

export async function downloadPlaintextAsset(path: string) {
	fs.writeFileSync(
		`./discord${path}`,
		await (await fetch(`https://discord.com${path}`)).text(),
	);
}

export async function fetchLinks(links: string[], rateLimit: boolean = false) {
	try {
		for (const link of links) {
			if (fs.existsSync(`./discord${link}`)) continue;
			plaintext(link)
				? await downloadPlaintextAsset(link)
				: await downloadBinaryAsset(link);
			if (rateLimit) await sleep(150);
			console.log(link);
		}
	} catch (e: any) {
		console.log(
			`An error occurred (reported as ${
				e.message || e
			}). Don't worry, this is normal, you're probably ratelimited. Trying again in 5 seconds.`,
		);
		await sleep(5000);
		await fetchLinks(links);
	}
}
