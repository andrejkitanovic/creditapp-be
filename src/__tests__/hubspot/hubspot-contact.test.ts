import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import Customer, { ICustomer } from '../../models/customer';
import { hsGetContactById, hsUpdateContact } from '../../controllers/hubspot';

describe('hubspot contact sync', () => {
	const customerEmail = 'test@lendzee.io';

	beforeAll(async () => {
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/creditapp-be');
	});

	afterAll(async () => {
		await mongoose.connection.close();
	});

	it('lendzee -> hubspot contact sync', async () => {
		let customer = await Customer.findOne({ email: customerEmail }).lean().orFail(new Error('Customer not found'));
		expect(customer.email).toBe(customerEmail);

		const fakeCustomer: Partial<ICustomer> = {
			firstName: `[TEST] ${faker.person.firstName()}`,
			middleName: faker.person.middleName(),
			lastName: faker.person.lastName(),
			salutation: faker.person.prefix(),
			social: faker.helpers.fromRegExp('[0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][0-9][0-9]'),
			zip: faker.location.zipCode(),
			city: faker.location.city(),
			address: faker.location.streetAddress(),
			state: faker.location.state(),
			phone: faker.phone.number(),
			mobilePhone: faker.phone.number(),
			submissionEmail: faker.internet.email().toLowerCase(),
			submissionPassword: faker.internet.password(),
		};
		await Customer.findByIdAndUpdate(customer._id, fakeCustomer).orFail(new Error('Customer failed to be updated'));

		customer = await Customer.findOne({ email: customerEmail }).lean().orFail(new Error('Customer not found'));
		expect(customer.firstName).toBe(fakeCustomer.firstName);
		expect(customer.middleName).toBe(fakeCustomer.middleName);
		expect(customer.lastName).toBe(fakeCustomer.lastName);
		expect(customer.salutation).toBe(fakeCustomer.salutation);
		expect(customer.social).toBe(fakeCustomer.social);
		expect(customer.zip).toBe(fakeCustomer.zip);
		expect(customer.city).toBe(fakeCustomer.city);
		expect(customer.address).toBe(fakeCustomer.address);
		expect(customer.state).toBe(fakeCustomer.state);
		expect(customer.phone).toBe(fakeCustomer.phone);
		expect(customer.mobilePhone).toBe(fakeCustomer.mobilePhone);
		expect(customer.submissionEmail).toBe(fakeCustomer.submissionEmail);
		expect(customer.submissionPassword).toBe(fakeCustomer.submissionPassword);

		const contact = await hsGetContactById(customer.hubspotId as string);
		expect(contact.firstname).toBe(customer.firstName);
		expect(contact.middle_name_or_initial).toBe(customer.middleName);
		expect(contact.lastname).toBe(customer.lastName);
		expect(contact.salutation).toBe(customer.salutation);
		expect(contact.zip).toBe(customer.zip);
		expect(contact.city).toBe(customer.city);
		expect(contact.address).toBe(customer.address);
		expect(contact.state).toBe(customer.state);
		expect(contact.phone).toBe(customer.phone);
		expect(contact.mobilephone).toBe(customer.mobilePhone);
		expect(contact.submission_email).toBe(customer.submissionEmail);
		expect(contact.submission_password).toBe(customer.submissionPassword);
	}, 60_000);

	it('hubspot -> lendzee customer sync', async () => {
		let customer = await Customer.findOne({ email: customerEmail }).lean().orFail(new Error('Customer not found'));
		expect(customer.email).toBe(customerEmail);

		const fakeCustomer: Partial<ICustomer> = {
			firstName: `[TEST] ${faker.person.firstName()}`,
			middleName: faker.person.middleName(),
			lastName: faker.person.lastName(),
			salutation: faker.person.prefix(),
			social: faker.helpers.fromRegExp('[0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][0-9][0-9]'),
			zip: faker.location.zipCode(),
			city: faker.location.city(),
			address: faker.location.streetAddress(),
			state: faker.location.state(),
			phone: faker.phone.number(),
			mobilePhone: faker.phone.number(),
			personalInfo: {},
			housingInfo: {},
			employmentInfo: {},
			securityQuestions: {},
			educationInfo: {},
			assetInfo: {},
			primaryResidenceValuation: {},
			submissionEmail: faker.internet.email().toLowerCase(),
			submissionPassword: faker.internet.password(),
		};
		await hsUpdateContact(customer.hubspotId as string, fakeCustomer);

		const contact = await hsGetContactById(customer.hubspotId as string);
		await Customer.findByIdAndUpdate(customer._id, {
			firstName: contact.firstname,
			middleName: contact.middle_name_or_initial,
			lastName: contact.lastname,
			salutation: contact.salutation,
			zip: contact.zip,
			city: contact.city,
			address: contact.address,
			state: contact.state,
			phone: contact.phone,
			mobilePhone: contact.mobilephone,
			submissionEmail: contact.submission_email,
			submissionPassword: contact.submission_password,
		}).orFail(new Error('Customer failed to be updated'));

		customer = await Customer.findOne({ email: customerEmail }).lean().orFail(new Error('Customer not found'));
		expect(customer.firstName).toBe(contact.firstname);
		expect(customer.middleName).toBe(contact.middle_name_or_initial);
		expect(customer.lastName).toBe(contact.lastname);
		expect(customer.salutation).toBe(contact.salutation);
		expect(customer.zip).toBe(contact.zip);
		expect(customer.city).toBe(contact.city);
		expect(customer.address).toBe(contact.address);
		expect(customer.state).toBe(contact.state);
		expect(customer.phone).toBe(contact.phone);
		expect(customer.mobilePhone).toBe(contact.mobilephone);
		expect(customer.submissionEmail).toBe(contact.submission_email);
		expect(customer.submissionPassword).toBe(contact.submission_password);
	}, 60_000);
});
