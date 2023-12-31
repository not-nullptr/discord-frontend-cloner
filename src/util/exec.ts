import { spawn } from "child_process";

export function runNodeApp(path: string, port: number) {
	return new Promise<number | null>((resolve) => {
		const childProcess = spawn("node", [path, port.toString()]);

		childProcess.stdout.on("data", (data) => {
			console.log(data.toString());
		});

		childProcess.stderr.on("data", (data) => {
			console.error(data.toString());
		});

		childProcess.on("close", (code) => {
			resolve(code);
		});
	});
}
