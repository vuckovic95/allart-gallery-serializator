/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	verbose: true,
	globals: {
		// This is necessary because next.js forces { "jsx": "preserve" }, but ts-jest requires { "jsx": "react-jsx" }
		'ts-jest': {
			tsconfig: {
				jsx: 'react-jsx',
			},
		},
	},
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.(ts|tsx|js)$': 'ts-jest',
		".+\\.(css|styl|less|sass|scss|png|jpg|svg|ttf|woff|woff2)$": "jest-transform-stub"
	},
	transformIgnorePatterns: [
		"/node_modules/(?!@project-serum/sol-wallet-adapter)"
	],
	moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
	moduleDirectories: ["node_modules", "src"],
};