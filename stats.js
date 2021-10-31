function quantile(arr, q) {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
    } else {
        return Math.floor(sorted[base]);
    }
}

function prepareData(result) {
	return result.data.map(item => {
		item.date = item.timestamp.split('T')[0];

		return item;
	});
}


function getDateString(date) {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function showMetricByPeriod(data, page, name, firstDate, lastDate) {
	console.log(`Metric '${name}' from ${firstDate} to ${lastDate}`);
	const arrForTable = [];

	const firstDateObj = new Date(firstDate);
	const lastDateObj = new Date(lastDate);

	const amountMilliSecondsInDay = 24 * 60 * 60 * 1000;
	let current = firstDateObj;

	while (lastDateObj - current !== 0) {
		const metric = addMetricByDate(data, page, name, getDateString(current));
		metric.date = getDateString(current);
		arrForTable.push(metric);
		current = new Date(current.valueOf() + amountMilliSecondsInDay);
	}

	const metric = addMetricByDate(data, page, name, getDateString(current));
	metric.date = getDateString(current);
	arrForTable.push(metric);
	return arrForTable;
}

// показать сессию пользователя
function showSession(data, page, requestId, date) {
	console.log(`Show session for user '${requestId}'`);
	const sortedData = data.filter((item) => item.requestId === requestId && item.date === date);

	return calcMetricsByDate(sortedData, page, date);
}

// сравнить метрику в разных срезах
function compareMetric(data, page, name, date, comparedProperty) {
	console.log(`Compare metric '${name}' by '${comparedProperty}' on ${date}`);
	const resArr = [];
	const available = new Set();
	const dataFilteredByDate = data.filter((item) => item.date === date);
	dataFilteredByDate.forEach((item) => available.add(item.additional[comparedProperty]));

	available.forEach((item) => {
		const sortedData = dataFilteredByDate.filter((elem) => elem.additional[comparedProperty] === item);
		const metric = {
			[comparedProperty]: item,
			...addMetricByDate(sortedData, page, name, date),
		}

		resArr.push(metric);
		});

	addMetricByDate(data, page, name, date);
	return resArr;
}


// Пример
// добавить метрику за выбранный день
function addMetricByDate(data, page, name, date) {
	let sampleData = data
					.filter(item => item.page == page && item.name == name && item.date == date)
					.map(item => item.value);

	let result = {};

	result.hits = sampleData.length;
	result.p25 = quantile(sampleData, 0.25);
	result.p50 = quantile(sampleData, 0.5);
	result.p75 = quantile(sampleData, 0.75);
	result.p95 = quantile(sampleData, 0.95);

	return result;
}
// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
	console.log(`All metrics on '${date}'`);
	let table = {};
	table.connect = addMetricByDate(data, page, 'connect', date);
	table.ttfb = addMetricByDate(data, page, 'ttfb', date);
	table.domComplete = addMetricByDate(data, page, 'domComplete', date);
	table.domInteractive = addMetricByDate(data, page, 'domInteractive', date);
	table.firstContentfulPaint = addMetricByDate(data, page, 'firstContentfulPaint', date);

	return table;
}

fetch('https://shri.yandex/hw/stat/data?counterId=034C8E32-B78C-4088-A944-FA55C13EB0E8')
	.then(res => res.json())
	.then(result => {
		let data = prepareData(result);
		console.table(calcMetricsByDate(data, 'super-uber-app', '2021-10-31'));
		console.table(showMetricByPeriod(data, 'super-uber-app', 'firstContentfulPaint', '2021-10-31', '2021-11-02'));
		console.table(showSession(data, 'super-uber-app', '100343388689', '2021-10-31'));
		 console.table(compareMetric(data, 'super-uber-app', 'ttfb', '2021-10-31', 'os'));
		console.table(compareMetric(data, 'super-uber-app', 'ttfb', '2021-10-31', 'platform'));

		// добавить свои сценарии, реализовать функции выше
	});
