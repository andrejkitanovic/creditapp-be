import { Schema, model, Document } from 'mongoose';
import { CBCRequestTypeEnum } from 'controllers/cbc';

interface IDealApplication extends Document {
	customer: string;
	hubspotId?: string;

	lender: string;
	loanAmount: number;
	monthlyPayment: number;
	term: number;
	creditInquiry: CBCRequestTypeEnum;
	applicationDate: Date;
	status: string;
	accountType: string;
	interestRate: number;
	loanWeightFactor: number;
	originationFee: number;
	reasonCode: string;
	apr: number;
}

const dealApplicationSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
	hubspotId: {
		type: String,
	},

	lender: {
		type: String,
		required: true,
	},
	loanAmount: {
		type: Number,
		required: true,
	},
	monthlyPayment: {
		type: Number,
		required: true,
	},
	term: {
		type: Number,
		required: true,
	},
	creditInquiry: {
		type: String,
		enum: CBCRequestTypeEnum,
		required: true,
	},
	applicationDate: {
		type: Date,
		required: true,
	},
	status: {
		type: String,
		required: true,
	},
	accountType: {
		type: String,
		required: true,
	},
});

const objectModel = model<IDealApplication>('Deal Application', dealApplicationSchema);

export { IDealApplication };
export default objectModel;
