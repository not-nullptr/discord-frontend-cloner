export function isMoreThan80PercentIdentical(arr: any[]): boolean {
	if (!Array.isArray(arr) || arr.length === 0) {
		throw new Error("Input must be a non-empty array.");
	}
	const totalElements = arr.length;
	const elementCounts: Record<string, number> = {};
	arr.forEach((element) => {
		elementCounts[element] = (elementCounts[element] || 0) + 1;
	});
	let mostFrequentElement;
	let mostFrequentCount = 0;
	for (const element in elementCounts) {
		if (elementCounts[element] > mostFrequentCount) {
			mostFrequentElement = element;
			mostFrequentCount = elementCounts[element];
		}
	}
	const percentageIdentical = (mostFrequentCount / totalElements) * 100;
	return percentageIdentical > 80;
}

export function isOfChunkType(potentialChunks: Object) {
	for (const key of Object.keys(potentialChunks)) {
		if (isNaN(Number(key))) {
			return false;
		}
	}
	for (const value of Object.values(potentialChunks)) {
		if (typeof value !== "string") {
			return false;
		}
	}
	return true;
}

export function validate(obj1: any, obj2: any) {
	for (const key of Object.keys(obj1)) {
		if (!obj2[key]) return false;
	}
	for (const key of Object.keys(obj2)) {
		if (!obj1[key]) return false;
	}
	return true;
}

export function plaintext(nameOrPath: string) {
	const plaintext = ["js", "css", "svg"];
	return plaintext.includes(nameOrPath.split(".").at(-1) || "");
}
