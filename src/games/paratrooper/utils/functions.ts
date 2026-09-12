export const checkTime = (lastTime: number, time: number, frequency: number) => {
	return (time - lastTime) > 1000 / frequency;
};
