export const calculateAPR = ({
	loanamount,
	numpayments,
	rate,
	costs,
}: {
	loanamount: number;
	numpayments: number;
	rate: number;
	costs: number;
}) => {
	const totalmonthlypayment =
		((loanamount + costs) * rate * Math.pow(1 + rate, numpayments)) / (Math.pow(1 + rate, numpayments) - 1);
	let testrate = rate;
	let iteration = 1;
	let testresult = 0;

	let testdiff = testrate;
	while (iteration <= 100) {
		testresult =
			(testrate * Math.pow(1 + testrate, numpayments)) / (Math.pow(1 + testrate, numpayments) - 1) -
			totalmonthlypayment / loanamount;
		if (Math.abs(testresult) < 0.0000001) break;
		if (testresult < 0) testrate += testdiff;
		else testrate -= testdiff;
		testdiff = testdiff / 2;
		iteration++;
	}
	testrate *= 12;
	return testrate.toFixed(6);
};
