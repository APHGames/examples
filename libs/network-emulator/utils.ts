/**
 * Randomly sorts an array
 */
export const shuffle = (arr: Array<any>) => {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

/**
 * Returns true if given time has already reached or exceeded certain period
 */
export const checkTime = (lastTime: number, time: number, frequency: number) => {
	return (time - lastTime) > 1000 / frequency;
};
