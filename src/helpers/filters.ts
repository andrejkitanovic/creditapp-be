import { Model } from 'mongoose';

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

			let parsedValue: string | number = value;
			if (!isNaN(value as any)) {
				parsedValue = Number.parseFloat(value);
			}

			if (operator === 'eq') {
				findBy[field] = value;
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
