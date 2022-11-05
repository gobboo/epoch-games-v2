import { createHash, createHmac, randomBytes } from "crypto";
import { chunk, flatten } from "lodash";

export function* byteGenerator(serverSeed: string, clientSeed: string, nonce: number, cursor: number) {
	let currentRound = Math.floor(cursor / 32);
	let currentRoundCursor = cursor;
	currentRoundCursor -= currentRound * 32;

	while (true) {
		const hmac = createHmac("sha256", serverSeed);
		hmac.update(`${clientSeed}:${nonce}:${currentRound}`);
		const buffer = hmac.digest();

		while (currentRoundCursor < 32) {
			yield Number(buffer[currentRoundCursor]);
			currentRoundCursor += 1;
		}
		currentRoundCursor = 0;
		currentRound += 1;
	}
}

export function shuffle(array: number[], floats: number[], includeMatrix = false) {
	const copy = [];
	const breakdown = [];
	let n = array.length;

	while (n > 1) {
		if (includeMatrix) {
			breakdown.push([...copy, ...array]);
		}

		const i = Math.floor(floats[copy.length]);

		n--;

		copy.push(array.splice(i, 1)[0]);
	}

	return includeMatrix ? [copy, breakdown] : copy;
}

export function generateServerSeeds() {
	const serverSeed = randomBytes(16).toString('hex');
	const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');

	return {
		serverSeed,
		serverSeedHash
	};
}

export function generateTiles(
	serverSeed: string,
	clientSeed: string,
	nonce: number,
	cursor: number,
	count: number
) {
	const floats = flatten(
		generateFloats(serverSeed, clientSeed, nonce, cursor, count)
	).map((float: number, index: number) => float * (25 - index));

	return shuffle(
		[
			...Array(25).keys()
		],
		floats
	).slice(0, count);
}

export function generateFloats(
	serverSeed: string,
	clientSeed: string,
	nonce: number,
	cursor: number,
	count: number
) {
	const numbers = byteGenerator(serverSeed, clientSeed, nonce, cursor);
	const bytes = [];

	while (bytes.length < count * 4) {
		bytes.push(numbers.next().value);
	}

	return chunk(bytes, 4).map((bytesChunk: any[]) =>
		bytesChunk.reduce((result, value, i) => {
			const divider = 256 ** (i + 1);
			const partialResult = value / divider;
			return result + partialResult;
		}, 0)
	);
}