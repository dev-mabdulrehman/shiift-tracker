// src/utils/timeCalc.js
export const calculateEndTime = (date, startTime, hours) => {
	if (!date || !startTime || !hours) return '';

	const [year, month, day] = date.split('-').map(Number);
	const [hoursStart, minutesStart] = startTime.split(':').map(Number);

	// Create date object based on start date and time
	const start = new Date(year, month - 1, day, hoursStart, minutesStart);

	// Add decimal hours (e.g., 10.5 hours = 10 hours 30 mins)
	const end = new Date(start.getTime() + parseFloat(hours) * 60 * 60 * 1000);

	return end.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	});
};
