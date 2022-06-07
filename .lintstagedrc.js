module.exports = {
	'*.{ts,tsx}': [() => 'tsc', 'eslint . --fix', 'npm run test'],
	'src/locales/*.json': [
		'npm run validate-translations',
		'npm run sync-sort-translations',
		'git add src/locales/en.json',
	],
};
