#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { execa } from 'execa';
import ora from 'ora';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const distPath = path.dirname(__filename);
const PKG_ROOT = path.join(distPath, './');
const srcDir = path.join(PKG_ROOT.toString().split('/dist')[0], 'template');

const validationRegExp =
	/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

const validateAppName = (input: string) => {
	const paths = input.split('/');

	const indexOfDelimiter = paths.findIndex((p: any) => p.startsWith('@'));

	let appName = paths[paths.length - 1];
	if (paths.findIndex((p) => p.startsWith('@')) !== -1) {
		appName = paths.slice(indexOfDelimiter).join('/');
	}

	if (input === '.' || validationRegExp.test(appName ?? '')) {
		return true;
	} else {
		return "App name must consist of only lowercase alphanumeric characters, '-', and '_'";
	}
};

interface ProjectTypes {
	name: string;
	dir: string;
	pkgManager: string;
	installDeps: boolean;
	initGit: boolean;
	version: string;
	license: string;
	keywords: string;
	description: string;
	getDir: () => string;
	getKeywordsArr: () => Array<string>;
}

const project: ProjectTypes = {
	name: '',
	dir: '',
	pkgManager: '',
	installDeps: false,
	initGit: false,
	version: '',
	license: '',
	keywords: '',
	description: '',
	getDir() {
		return this.dir + '/' + this.name;
	},
	getKeywordsArr() {
		return this.keywords.split(' ');
	},
};

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
			name: 'name',
			type: 'input',
			default: 'app',
			message: 'What is your project name:  ',
			validate: validateAppName,
		})
		.then((value: { name: string }) => {
			project.name = value.name;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});
	await inquirer
		.prompt({
			name: 'dir',
			type: 'input',
			default: '.',
			message: 'What is your project directory:  ',
		})
		.then((value: { dir: string }) => {
			project.dir = value.dir;
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
			message: 'What is your project description: ',
		})
		.then((value: { description: string }) => {
			project.description = value.description;
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
			message: 'What is your project version:  ',
		})
		.then((value: { version: string }) => {
			project.version = value.version;
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
			message: 'What is your project keywords (separate them with spaces):  ',
		})
		.then((value: { keywords: string }) => {
			project.keywords = value.keywords;
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
			message: 'What is your project license:  ',
		})
		.then((value: { license: string }) => {
			project.license = value.license;
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
			message: 'Do you want to initialize git:  ',
		})
		.then(async (value: { initGit: boolean }) => {
			project.initGit = value.initGit;
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
			message: 'Do you want to install the dependencies:  ',
		})
		.then((value: { installDeps: boolean }) => {
			project.installDeps = value.installDeps;
		})
		.catch(() => {
			console.error(
				'Oops!, Something wrong happened. Exiting the cli'
			);
			process.exit(1);
		});

	if (project.installDeps) {
		await inquirer
			.prompt({
				name: 'pkgManager',
				type: 'list',
				message: 'What is your preferred package manager:  ',
				choices: ['npm', 'yarn', 'pnpm'],
			})
			.then((value: { pkgManager: string }) => {
				project.pkgManager = value.pkgManager;
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
	const spinner = ora(`Scaffolding in: ${project.getDir()}...\n`).start();

	if (fs.existsSync(project.getDir())) {
		if (fs.readdirSync(project.getDir()).length === 0) {
			if (project.name !== '.')
				spinner.info(
					`${chalk.cyan.bold(
						project.name
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
					project.name
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
						project.name
					)} and creating dax-stax app..\n`
				);
				fs.emptyDirSync(project.getDir());
			}
		}
	}

	spinner.start();

	fs.copySync(srcDir, project.getDir());
	fs.renameSync(
		path.join(project.getDir(), '_gitignore'),
		path.join(project.getDir(), '.gitignore')
	);

	const scaffoldedName =
		project.name === '.' ? 'App' : chalk.cyan.bold(project.name);

	fs.readFile(project.getDir() + '/package.json', (err, data) => {
		if (err) throw err;

		let packageJsonObj = JSON.parse(data.toString());

		packageJsonObj.name = project.name;
		packageJsonObj.description = project.description;
		packageJsonObj.version = project.version;
		packageJsonObj.keywords = project.getKeywordsArr();
		packageJsonObj.license = project.license;
		packageJsonObj = JSON.stringify(packageJsonObj);
		fs.writeFile(
			project.getDir() + '/package.json',
			packageJsonObj,
			(err: any) => {
				if (err) throw err;
			}
		);
	});

	spinner.succeed(
		`${scaffoldedName} ${chalk.green('scaffolded successfully!')}\n`
	);
};

const runInstallCommand = async () => {
	switch (project.pkgManager) {
		case 'npm':
			await execa(project.pkgManager, ['install'], {
				cwd: project.getDir(),
				stderr: 'inherit',
			});

			return null;
		case 'pnpm':
			const pnpmSpinner = ora('Running pnpm install...').start();
			const pnpmSubprocess = execa(project.pkgManager, ['install'], {
				cwd: project.getDir(),
				stdout: 'pipe',
			});

			await new Promise<void>((res, rej) => {
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
			const yarnSubprocess = execa(project.pkgManager, [], {
				cwd: project.getDir(),
				stdout: 'pipe',
			});

			await new Promise<void>((res, rej) => {
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
	await execa('git', ['init'], {
		cwd: project.getDir(),
		stderr: 'inherit',
	});
};

const installDependencies = async () => {
	const installSpinner = await runInstallCommand();

	(installSpinner || ora()).succeed(
		chalk.green('Successfully installed dependencies!\n')
	);
};

const updatePackages = async () => {
	switch (project.pkgManager) {
		case 'npm':
			await execa(project.pkgManager, ['update'], {
				cwd: project.getDir(),
				stderr: 'inherit',
			});

			return null;
		case 'pnpm':
			const pnpmSpinner = ora('Running pnpm update...').start();
			const pnpmSubprocess = execa(project.pkgManager, ['update'], {
				cwd: project.getDir(),
				stdout: 'pipe',
			});

			await new Promise<void>((res, rej) => {
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
			const yarnSubprocess = execa(project.pkgManager, [], {
				cwd: project.getDir(),
				stdout: 'pipe',
			});

			await new Promise<void>((res, rej) => {
				yarnSubprocess.stdout?.on('data', (data) => {
					yarnSpinner.text = data.toString();
				});
				yarnSubprocess.on('error', (e) => rej(e));
				yarnSubprocess.on('close', () => res());
			});

			return yarnSpinner;
	}
};

console.clear();
await entry();
await askStack();
await scaffoldProject();

if (project.initGit) {
	await initializeGit();
}
if (project.installDeps) {
	await installDependencies();
	await updatePackages();
}

console.log(`
${chalk.green('✔ Application has been setup!')}

Run the following commands to start on your ${gradient.rainbow(
	'Million Dollar Idea!'
)}:

${chalk.blue(`
- cd ${project.getDir()}
${!project.installDeps ? '- npm run install' : ''}
- npm run dev
`)}

Good Luck!!
`);
