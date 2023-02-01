import axios from 'axios';
import { ICreditEvaluation } from 'models/creditEvaluation';
import { ICustomer } from 'models/customer';
import { ILoanApplication } from 'models/loanApplication';
import { LeanDocument } from 'mongoose';

const axiosEvent = axios.create({
	baseURL: 'https://api.evenfinancial.com',
	headers: {
		Authorization: `Bearer ${process.env.EVENT_APIKEY}`,
	},
});

export const eventPostLoanApplication = (
	customer: LeanDocument<ICustomer>,
	creditEvaluation: LeanDocument<ICreditEvaluation>,
	loanApplication: LeanDocument<ILoanApplication>
) => {
	const creditScore = creditEvaluation.creditScores.find((creditScore) => creditScore.type === 'XPN')?.score ?? 0;

	// Excellent (720+) Good (660-719) Fair (620-659) Poor (<620)
	let providedCreditRating = 'fair';
	if (creditScore >= 660 && creditScore <= 719) {
		providedCreditRating = 'good';
	} else if (creditScore >= 720) {
		providedCreditRating = 'excellent';
	}
	return axiosEvent.post('/leads/rateTables', {
		productTypes: ['loan'],
		personalInformation: {
			firstName: customer.firstName,
			lastName: customer.lastName,
			email: customer.email,
			city: customer.city,
			state: customer.state,
			// primaryPhone: '2125556789',
			// address1: '175 5th Ave',
			// address2: 'Apartment 5',
			zipcode: customer.zip,
			// dateOfBirth: '1993-10-09',
			ssn: customer.social,
		},
		loanInformation: {
			// purpose: 'debt_consolidation',
			loanAmount: loanApplication.loanAmount,
		},
		mortgageInformation: {
			// propertyStatus: 'own_with_mortgage',
		},
		creditInformation: {
			providedCreditRating,
		},
		financialInformation: {
			// employmentStatus: 'employed',
			// employmentPayFrequency: 'biweekly',
			// annualIncome: 80000,
		},
		educationInformation: {
			// educationLevel: 'bachelors',
		},
		legalInformation: {
			consentsToFcra: true,
			consentsToTcpa: true,
		},
	});
};
