import dayjs from 'dayjs';
import mongoose from 'mongoose';
import {
	Model,
	// isValidObjectId
} from 'mongoose';

import { populateDates } from './dateMapping';

interface IFilters {
	Model: Model<any>;
	query: any;
	populate?: string;
	searchFields?: string[];
	defaultFilters?: { [x: string]: any };
}

export const queryFilter = async ({ Model, query, populate, searchFields, defaultFilters }: IFilters) => {
	const sort: string = query.sort ?? '';
	const limit: number = query.limit ?? 20;
	const page: number = query.page ?? 1;
	const q: string = query.q ?? '';
	const filter: string = query.filter ?? '';

	let findBy: { [x: string]: any } = defaultFilters ?? {};

	if (filter) {
		const filterValues = filter.split(',');

		filterValues.map((single) => {
			const [field, operator, value] = single.split('::');

			let parsedValue: string | number | null | any[] = value;
			if (!isNaN(value as any)) {
				parsedValue = Number.parseFloat(value);
			} else if (value === 'null' || value === 'undefined') {
				parsedValue = [null, undefined];
			}

			if (operator === 'eq') {
				findBy[field] = parsedValue;
			} else if (operator === 'is') {
				if (field.includes('.')) {
					const [firstField, secondField] = field.split('.');
					findBy[firstField] = { $elemMatch: { [secondField]: new mongoose.Types.ObjectId(parsedValue as string) } };
				} else findBy[field] = new mongoose.Types.ObjectId(parsedValue as string);
			} else findBy[field] = { [`$${operator}`]: parsedValue };
		});
	}

	const search: { [x: string]: any }[] | any = [];

	if (q && searchFields) {
		searchFields.forEach((field) => {
			search.push({ [field]: { $regex: new RegExp(q, 'i') } });
		});
	}
	if (search.length) {
		findBy = { ...findBy, $or: search };
	}

	let modelQuery = Model.find(findBy);
	if (populate) {
		modelQuery = modelQuery.populate({ path: populate });
	}
	if (sort) {
		modelQuery = modelQuery.sort(sort);
	}

	const data = await modelQuery
		.limit(limit)
		.skip((page - 1) * limit)
		.sort(sort);
	const count = (await Model.find(findBy)).length;

	return { data, count };
};

interface IStatisticFilters {
	Model: Model<any>;
	query: any;
	defaultFilters?: { [x: string]: any };
	operator: string;
	field: string;
}

export const queryStatisticFilter = async ({ Model, query, defaultFilters, 
	// operator, field
 }: IStatisticFilters) => {
	const startDate: Date = query.from ?? dayjs().startOf('year').toDate();
	const filter: string = query.filter ?? '';

	const findBy: { [x: string]: any } = defaultFilters ?? {};

	if (filter) {
		const filterValues = filter.split(',');

		filterValues.map((single) => {
			const [field, operator, value] = single.split('::');

			let parsedValue: any = value;
			if (!isNaN(value as any)) {
				parsedValue = Number.parseFloat(value);
			} else if (value === 'null' || value === 'undefined') {
				parsedValue = [null, undefined];
			}

			if (operator === 'eq') {
				findBy[field] = parsedValue;
			} else if (operator === 'is') {
				if (field.includes('.')) {
					const [firstField, secondField] = field.split('.');
					findBy[firstField] = { $elemMatch: { [secondField]: new mongoose.Types.ObjectId(parsedValue as string) } };
				} else findBy[field] = new mongoose.Types.ObjectId(parsedValue as string);
			} else findBy[field] = { [`$${operator}`]: parsedValue };
		});
	}
	const findByToArray = Object.keys(findBy).map((key) => ({ [key]: findBy[key] }));

	const aggregateData = await Model.aggregate([
		{
			$match: {
				$and: [...findByToArray, { date: { $gte: startDate } }],
			},
		},
		{
			$group: {
				_id: { $dateToString: { format: '%Y-%m', date: '$date' } },
				// value: { [`$${operator}`]: `$${field}` },
			},
		},
		{
			$sort: {
				_id: 1,
			},
		},
		{
			$project: {
				_id: 0,
				date: '$_id',
				value: '$value',
			},
		},
	]);
	const data = populateDates({ startDate }, aggregateData, 'year');

	return { data };
};
