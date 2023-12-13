const { executeSync } = require('graphql')
const { execSync } = require('node:child_process')

module.exports = function globalSetup() {

	const whichAptos = execSync('which aptos').toString()

	if (!whichAptos) {
		throw new Error("Aptos CLI is not installed")
	}

	const localTestNetRunning = execSync('ps -ax | grep aptos').toString().split(' ')
	if (localTestNetRunning[localTestNetRunning.length - 2] !== "run-local-testnet") {
		throw new Error("TestNet is not running")
	}
}
