#!/usr/bin/env node

const { program } = require('commander');
const fs = require("fs").promises
const Configstore = require('configstore');
const chalk = require('chalk');
const path = require('path');
const inquirer = require('inquirer');
let treeify = require('treeify');
const cfg = new Configstore("gitn", { 'INIT': false });

let INIT = cfg.get('INIT');
let NOTE_DIR = cfg.get('NOTE_DIR');
let CURRENT_BRANCH = cfg.get('CURRENT_BRANCH');
let CONFIG = cfg.all;

program.version('0.1.0');

program
  .command('config')
  .option('-g , --globaldir <directory>', 'set global notes directory path')
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
      console.log(`${chalk.red('Do not edit manually !! Things may start breaking\n')}`);
      console.log(chalk.blue("use 'gitn config -g <absolute_path_to_notes_directory>' to change notes directory"))
    }
  });

(function isInitialised(CONFIG) {
  if (Object.keys(CONFIG).length === 0) {
    console.log(chalk.red.bold('notes directory not set !!\n'));
    console.log(chalk.blue("use 'gitn config -g <absolute_path_to_notes_directory>' to initialise gitn"));
    return;
  }
}(CONFIG));


program
  .command('status ')
  .description('outputs current branch')
  .action(() => {
    console.log(chalk.green(`On branch ${chalk.bold.blue(cfg.get('CURRENT_BRANCH'))}\n`));
  })

program
  .command('log')
  .option('-g --grep <pattern>', 'find notes by searching string/pattern')
  .description('outputs notes on current branch')
  .action(async (args) => {
    let filehandle;
    try {
      filehandle = await fs.open(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, 'r');
      data = await filehandle.readFile('utf-8');
      console.log(chalk.green(`On branch ${chalk.bold.blue(CURRENT_BRANCH)}`));
      notes = data.split("\n");
      notes.pop();
      if (args.grep) {

        let re = new RegExp(args.grep);
        notes = notes.filter(e => {
          return re.test(e)
        })
      }
      notes.forEach(e => {
        console.log(`---> ${e}`)
      })
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
  .command('branch [branch]')
  .option('-d --delete ', 'delete a branch')
  .option('-a --all', 'show all branches with commits')
  .action(async (branch) => {
    let files;
    let filehandle;
    if (program.args.includes('-d') || program.args.includes('--delete')) {
      try {
        if (!branch) throw new Error(" option '-d --delete' requires <branch> to be specified");
        if (CURRENT_BRANCH == branch) throw new Error("On same branch. Switch to another branch.");
        await fs.unlink(`${NOTE_DIR}${branch}.txt`);
      } catch (e) {
        if (e.errno === -2) {
          console.log(chalk.red(`branch '${chalk.bold(branch)}' does not exist.`));
        } else
          console.log(chalk.red(e.message));
      }
    } else if (program.args.includes('-a') || program.args.includes('--all')) {
      try {
        if (branch) throw new Error(" option '-a --all' does not take any argument");
        let branchNotesTree = {};
        files = await fs.readdir(`${NOTE_DIR}`, 'utf-8');
        for (let i = 0; i < files.length; i++) {
          files[i] = files[i].split('.')[0]
          branchNotesTree[files[i]] = {};
          filehandle = await fs.open(`${NOTE_DIR}${files[i]}.txt`, 'r');
          data = await filehandle.readFile('utf-8');
          notes = data.split("\n");
          notes.pop();
          notes.forEach(e=>{
            branchNotesTree[files[i]][e]=null;
          })
        }
        console.log(treeify.asTree(branchNotesTree,true));

      } catch (e) {
        console.log(chalk.red(e.message));
      }
    }
    else if (!branch) {
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
        filehandle = await fs.open(`${NOTE_DIR}${branch}.txt`, 'wx'); // wx fails if exist, so may use w 
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
  .option('-b --newBranch', 'create a new branch')
  .description('create/switch branch')
  .action(async (branch) => {
    let filehandle;
    if (program.args.includes('-b') || program.args.includes('--createBranch')) {
      try {
        filehandle = await fs.open(`${NOTE_DIR}${branch}.txt`, 'wx'); // wx fails if exist, so may use w 
        cfg.set('CURRENT_BRANCH', `${branch}`)
        console.log(chalk.green(`created and switched to new branch ${chalk.bold.blue(branch)}`))
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

program
  .command('rebase')
  .description('delete notes on branch')
  .action(async () => {
    let filehandle;
    try {
      filehandle = await fs.open(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, "r+");
      data = await filehandle.readFile('utf-8');
      if (filehandle !== undefined)
        await filehandle.close();
      console.log(chalk.green(`On branch ${chalk.bold.blue(CURRENT_BRANCH)}`));
      notes = data.split('\n');
      notes.pop();
      let choices = [];
      choices = notes.map(i => { return { name: i } });
      let resp = await inquirer
        .prompt([
          {
            type: 'checkbox',
            message: 'Select Notes to Delete',
            name: 'delete',
            choices,
          }
        ])

      if (resp.delete.length !== 0) {

        notes = notes.filter(n => {
          return !resp.delete.includes(n)
        })
        let updatedNotes = notes.reduce((acc, curr) => {
          acc = acc + curr + "\n";
          return acc;
        }, "")

        await fs.writeFile(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, updatedNotes)
        console.log(`saved`)
      }

    } catch (e) {
      console.log(e)
    }

  })



program.parse(process.argv);