import path from 'path';

module.exports = {
	testEnvironment: 'node',
	moduleDirectories: ['node_modules', __dirname, path.join(__dirname, './src')],
	testMatch: ["**/?(*.)+(spec|test).ts"],
};
