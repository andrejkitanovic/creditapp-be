import { Schema, model, Document } from 'mongoose';

interface IIncomeSource extends Document {
	customer: string;
}

const incomeSourceSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
});

const objectModel = model<IIncomeSource>('Income Source', incomeSourceSchema);

export { IIncomeSource };
export default objectModel;
