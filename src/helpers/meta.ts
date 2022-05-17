export const createMeta = ({ page = 1, limit = 20, count }: { page?: number; limit?: number; count: number }) => {
	return {
		pagination: {
			currentPage: page,
			pageSize: limit,
			totalPages: Math.ceil(count / limit),
			totalResults: count,
		},
	};
};

export const createMetaStatistics = ({ values }: { values: number[] }) => {
	const total = values.reduce((total, value) => total + value, 0);
	const sortedValues = [...values].sort();
	return {
		statistics: {
			total: total,
			average: total / values.length,
			max: sortedValues[sortedValues.length - 1],
			min: sortedValues[0],
		},
	};
};
