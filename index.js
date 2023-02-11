#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { execa } from 'execa';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const distPath = path.dirname(__filename);
const PKG_ROOT = path.join(distPath, './');
const srcDir = path.join(PKG_ROOT, 'template');

let projectDir;
let projectName;
let pkgManager;
let installDeps = false;
let initGit = false;
let version;
let license;
let keywords;
let description;

const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));

async function entry() {
	figlet('Create-Dax-Stax', function (err, data) {
		console.log(gradient.pastel.multiline(data));
	});
	await sleep();
	console.log(`Welcome to Create-Dax-Stax,
A cli tool to build your next Million Dollar Idea using ${chalk.bgRed(
		` Dax's `
	)} favorite web dev tools.
    `);
	await sleep(500);
}

async function askStack() {
	await inquirer
		.prompt({
			name: 'step_1',
			type: 'input',
			default: 'app',
			message: 'What is your project name',
		})
		.then((value) => {
			projectName = value.step_1;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});
	await inquirer
		.prompt({
			name: 'step_2',
			type: 'input',
			default: '.',
			message: 'What is your project directory',
		})
		.then((value) => {
			projectDir = value.step_2;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});

	await inquirer
		.prompt({
			name: 'description',
			type: 'input',
			message: 'What is your project description',
		})
		.then((value) => {
			description = value.description;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});
	await inquirer
		.prompt({
			name: 'version',
			type: 'input',
			default: '1.0.0',
			message: 'What is your project version?',
		})
		.then((value) => {
			version = value.version;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});
	await inquirer
		.prompt({
			name: 'keywords',
			type: 'input',
			message: 'What is your project keywords? (separate them with spaces)',
		})
		.then((value) => {
			keywords = value.keywords;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});
	await inquirer
		.prompt({
			name: 'license',
			type: 'input',
			default: 'MIT',
			message: 'What is your project license?',
		})
		.then((value) => {
			license = value.license;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});

	await inquirer
		.prompt({
			name: 'initGit',
			type: 'confirm',
			message: 'Do you want to initialize git?',
		})
		.then(async (value) => {
			initGit = value.initGit;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});
	await inquirer
		.prompt({
			name: 'installDeps',
			type: 'confirm',
			message: 'Do you want to install the dependencies?',
		})
		.then((value) => {
			installDeps = value.installDeps;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});

	if (installDeps) {
		await inquirer
			.prompt({
				name: 'setPackageManager',
				type: 'list',
				message: 'What is your preferred package manager',
				choices: ['npm', 'yarn', 'pnpm'],
			})
			.then((value) => {
				pkgManager = value.setPackageManager;
			})
			.catch(() => {
				console.error(
					'Oops!, Something wrong happened. Exiting the cli'
				);
				process.exit(1);
			});
	}
}

const scaffoldProject = async () => {
	const dir = projectDir + '/' + projectName;

	const spinner = ora(`Scaffolding in: ${dir}...\n`).start();

	if (fs.existsSync(dir)) {
		if (fs.readdirSync(dir).length === 0) {
			if (projectName !== '.')
				spinner.info(
					`${chalk.cyan.bold(
						projectName
					)} exists but is empty, continuing...\n`
				);
		} else {
			spinner.stopAndPersist();
			const { overwriteDir } = await inquirer.prompt({
				name: 'overwriteDir',
				type: 'list',
				message: `${chalk.redBright.bold(
					'Warning:'
				)} ${chalk.cyan.bold(
					projectName
				)} already exists and isn't empty. How would you like to proceed?`,
				choices: [
					{
						name: 'Abort installation (recommended)',
						value: 'abort',
						short: 'Abort',
					},
					{
						name: 'Clear the directory and continue installation',
						value: 'clear',
						short: 'Clear',
					},
					{
						name: 'Continue installation and overwrite conflicting files',
						value: 'overwrite',
						short: 'Overwrite',
					},
				],
				default: 'abort',
			});
			if (overwriteDir === 'abort') {
				spinner.fail('Aborting installation...');
				process.exit(1);
			}

			const overwriteAction =
				overwriteDir === 'clear'
					? 'clear the directory'
					: 'overwrite conflicting files';

			const { confirmOverwriteDir } = await inquirer.prompt({
				name: 'confirmOverwriteDir',
				type: 'confirm',
				message: `Are you sure you want to ${overwriteAction}?`,
				default: false,
			});

			if (!confirmOverwriteDir) {
				spinner.fail('Aborting installation...');
				process.exit(1);
			}

			if (overwriteDir === 'clear') {
				spinner.info(
					`Emptying ${chalk.cyan.bold(
						projectName
					)} and creating t3 app..\n`
				);
				fs.emptyDirSync(dir);
			}
		}
	}

	spinner.start();

	fs.copySync(srcDir, dir);
	fs.renameSync(path.join(dir, '_gitignore'), path.join(dir, '.gitignore'));

	const scaffoldedName =
		projectName === '.' ? 'App' : chalk.cyan.bold(projectName);

	fs.readFile(dir + '/package.json', (err, data) => {
		if (err) throw err;

		let packageJsonObj = JSON.parse(data);

		packageJsonObj.name = projectName;
		packageJsonObj.description = description;
		packageJsonObj.version = version;
		packageJsonObj.keywords = keywords.split(' ');
		packageJsonObj.license = license;
		packageJsonObj = JSON.stringify(packageJsonObj);
		fs.writeFile(dir + '/package.json', packageJsonObj, (err) => {
			if (err) throw err;
		});
	});

	spinner.succeed(
		`${scaffoldedName} ${chalk.green('scaffolded successfully!')}\n`
	);
};

const runInstallCommand = async () => {
	const dir = projectDir + '/' + projectName;

	switch (pkgManager) {
		case 'npm':
			await execa(pkgManager, ['install'], {
				cwd: dir,
				stderr: 'inherit',
			});

			return null;
		case 'pnpm':
			const pnpmSpinner = ora('Running pnpm install...').start();
			const pnpmSubprocess = execa(pkgManager, ['install'], {
				cwd: dir,
				stdout: 'pipe',
			});

			await new Promise((res, rej) => {
				pnpmSubprocess.stdout?.on('data', (data) => {
					const text = data.toString();

					if (text.includes('Progress')) {
						pnpmSpinner.text = text.includes('|')
							? text.split(' | ')[1] ?? ''
							: text;
					}
				});
				pnpmSubprocess.on('error', (e) => rej(e));
				pnpmSubprocess.on('close', () => res());
			});

			return pnpmSpinner;
		case 'yarn':
			const yarnSpinner = ora('Running yarn...').start();
			const yarnSubprocess = execa(pkgManager, [], {
				cwd: dir,
				stdout: 'pipe',
			});

			await new Promise((res, rej) => {
				yarnSubprocess.stdout?.on('data', (data) => {
					yarnSpinner.text = data.toString();
				});
				yarnSubprocess.on('error', (e) => rej(e));
				yarnSubprocess.on('close', () => res());
			});

			return yarnSpinner;
	}
};

const initializeGit = async () => {
	const dir = projectDir + '/' + projectName;

	if (initGit) {
		await execa('git', ['init'], {
			cwd: dir,
			stderr: 'inherit',
		});
	}
};

const installDependencies = async () => {
	const dir = projectDir + '/' + projectName;

	const installSpinner = await runInstallCommand(pkgManager, dir);

	// If the spinner was used to show the progress, use succeed method on it
	// If not, use the succeed on a new spinner
	(installSpinner || ora()).succeed(
		chalk.green('Successfully installed dependencies!\n')
	);
};

console.clear();
await entry();
await askStack();
await scaffoldProject();
await initializeGit();
await installDependencies();
