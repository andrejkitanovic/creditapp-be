import { Schema, model, Document } from 'mongoose';

// type TypeWhiteLabeledDomains = 'gmail' | 'deckerdevs';

interface IUser extends Document {
	email: string;
}

const userSchema: Schema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true,
	},
});

const objectModel = model<IUser>('User', userSchema);

export { IUser };
export default objectModel;
