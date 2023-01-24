export const calculateAPR = (loanAmount: number, term: number, interestRate: number, originationFee: number) => {
	/* 
	loanAmount 	= the amount borrowed
	term	= number of monthly payments e.g. 30 years = 360
	interestRate	= the base percentage rate of the loan. A 5.25% Annual Rate should be passed in as 0.0525 NOT 5.25
	originationFee		= the loan closing costs e.g. origination fee, broker fees, etc.
	*/

	const rate = interestRate / 12;
	const totalmonthlypayment =
		((loanAmount + originationFee) * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
	let testrate = rate;
	let iteration = 1;
	let testresult = 0;

	// Iterate until result = 0
	let diff = testrate;
	while (iteration <= 100) {
		testresult =
			(testrate * Math.pow(1 + testrate, term)) / (Math.pow(1 + testrate, term) - 1) - totalmonthlypayment / loanAmount;
		if (Math.abs(testresult) < 0.0000001) break;
		if (testresult < 0) testrate += diff;
		else testrate -= diff;
		diff = diff / 2;
		iteration++;
	}
	testrate = testrate * 12;
	return testrate.toFixed(6);
};

export const calculateLoanWeightFactor = (loanAmount: number, interestRate: number) => loanAmount * interestRate;
