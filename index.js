#!/usr/bin/env node

const { program } = require('commander');
const fs = require("fs").promises
const Configstore = require('configstore');
const chalk = require('chalk');
const path = require('path')

const cfg = new Configstore("gitn", { 'INIT': false });

let INIT = cfg.get('INIT');
let NOTE_DIR = cfg.get('NOTE_DIR');
let CURRENT_BRANCH = cfg.get('CURRENT_BRANCH');


program.version('0.0.1');

program
  .command('config')
  .option('-g , --globaldir <directory>', 'edit global notes directory file')
  .description('view/edit global config file')
  .action(async (args) => {
    if (args.globaldir) {
      let p = args.globaldir;
      if (process.platform === "win32") {
        p += (p.endsWith('\\') ? '' : '\\');
      } else {
        p += (p.endsWith('/') ? '' : '/');
      }
      let filehandle;
      try {
        if (!path.isAbsolute(p)) throw new Error("Please provide absolute path")
        await fs.mkdir(p, { recursive: true });
        filehandle = await fs.open(`${p}master.txt`, 'w'); //wx fails if exists

        cfg.set('INIT', true);
        cfg.set('NOTE_DIR', p);
        cfg.set('CURRENT_BRANCH', 'master');

      } catch (e) {
        // if (e.code == 'EEXIST') {
        //   console.log(chalk.red('global directory already exists here. using it now.'))
        // } else 
        if (e.code == 'ENOENT') {
          console.log(chalk.red('invalid path provided'))
        } else {
          console.log(chalk.red(e.message))
        }
      } finally {
        if (filehandle !== undefined)
          await filehandle.close();
      }
    } else {
      // show contents of config as well 
      console.log(`${chalk.red('Do not change manually !! Stuff may start breaking')}`)
      console.log(cfg.path)

    }
  })


program
  .command('status ')
  .description('outputs current branch')
  .action(() => {
    console.log(chalk.green(`On branch ${chalk.bold.blue(cfg.get('CURRENT_BRANCH'))}\n`));
  })

program
  .command('log ')
  .description('outputs notes on current branch')
  .action(async () => {
    let filehandle;
    try {
      filehandle = await fs.open(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, 'r');
      data = await filehandle.readFile('utf-8');
      console.log(chalk.green(`On branch ${chalk.bold.blue(CURRENT_BRANCH)}`));
      console.log(data);
    } finally {
      if (filehandle !== undefined)
        await filehandle.close();
    }
  })

program
  .command('commit')
  .requiredOption('-m , --message <msg>', 'commit must have a mesage')
  .action(async (args) => {
    let filehandle;
    try {
      filehandle = await fs.open(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, 'a', 666);
      await fs.appendFile(filehandle, args.message + '\n', 'utf-8');
    } finally {
      if (filehandle !== undefined)
        await filehandle.close();
    }

  })


program
  .command('branch [newBranch]')
  .action(async (newBranch) => {
    let files;
    let filehandle;
    if (!newBranch) {
      try {
        files = await fs.readdir(`${NOTE_DIR}`, 'utf-8');
        files.forEach(e => {
          e = e.split('.')[0] // only file(branch) name
          if (e === CURRENT_BRANCH)
            console.log(`${e}${chalk.bold.green('*')}`);
          else
            console.log(e)
        })
      } catch (e) {
        console.log(chalk.red('some error occured:'), e)
      }
    } else {
      try {
        filehandle = await fs.open(`${NOTE_DIR}${newBranch}.txt`, 'wx'); // wx fails if exist, so may use w 
        // console.log(filehandle)
      } catch (e) {
        if (e.code == 'EEXIST') {
          console.log(chalk.red('branch already exists'))
        } else {
          console.log(e)
        }
      } finally {
        if (filehandle !== undefined)
          await filehandle.close();
      }
    }

  })


program
  .command('checkout <branch>')
  .option('-b --createBranch')
  .description('create/switch branch')
  .action(async (branch) => {
    let filehandle;
    if (program.args.includes('-b') || program.args.includes('--createBranch')) {
      try {
        filehandle = await fs.open(`${NOTE_DIR}${branch}.txt`, 'wx'); // wx fails if exist, so may use w 
        cfg.set('CURRENT_BRANCH', `${branch}`)
        console.log(chalk.green(`created and switched to branch ${chalk.bold.blue(branch)}`))
      } catch (e) {
        if (e.code == 'EEXIST') {
          cfg.set('CURRENT_BRANCH', `${branch}`)
          console.log(chalk.red(`switched to already existing branch ${chalk.green(branch)}`))
        } else {
          console.log(e)
        }
      } finally {
        if (filehandle !== undefined)
          await filehandle.close();
      }
    }
    else {
      let files;
      try {
        files = await fs.readdir(`${NOTE_DIR}`, 'utf-8');
        let changed = false;
        files.forEach(e => {
          e = e.split('.')[0] // only file(branch) name
          if (e === branch) {
            changed = true;
            console.log(`${chalk.green('switched to branch ')}${chalk.bold.blue(branch)}`)
            cfg.set('CURRENT_BRANCH', `${branch}`)
          }
        })
        if (!changed) {
          throw new Error('no such branch exists.');
        }
      } catch (e) {
        console.log(chalk.red(e.message));
      }
    }
  })

program
  .command('merge <branch>')
  .description('merge branch into current branch')
  .action(async (branch) => {
    let filehandle;
    let currentFilehandle;
    try {
      if (branch === CURRENT_BRANCH) throw ({ errno: 8989, msg: 'on same branch' })
      filehandle = await fs.open(`${NOTE_DIR}${branch}.txt`, 'r');
      data = await filehandle.readFile('utf-8');
      currentFilehandle = await fs.open(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, 'a', 666);
      await fs.appendFile(currentFilehandle, data, 'utf-8');
      await fs.unlink(`${NOTE_DIR}${branch}.txt`);
    } catch (e) {
      if (e.errno === -2) {
        console.log(chalk.red('no such branch'));
      } else if (e.errno === 8989) {
        console.log(chalk.red(e.msg));
      } else
        console.log(e);
    } finally {
      if (filehandle !== undefined)
        await filehandle.close();
      if (currentFilehandle !== undefined)
        await currentFilehandle.close();
    }

  })



program.parse(process.argv);