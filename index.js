const { program } = require('commander');
const fs = require("fs").promises
program.version('0.0.1');


// ---------config store code
const Configstore = require('configstore');
const cfg = new Configstore("gitn");
let NOTE_DIR = cfg.get('NOTE_DIR');
let CURRENT_BRANCH = cfg.get('CURRENT_BRANCH');

// ----config store code
program
  .command('config')
  .option('-g , --globaldir <directory>','edit global notes directory file')
  .description('view/edit global config file')
  .action(async (args) => {
    if(args.globaldir){
      cfg.set('NOTE_DIR',args.globaldir);
      cfg.set('INIT',true);
      cfg.set('CURRENT_BRANCH','master');

      let filehandle;
      try {
        await fs.mkdir(`${cfg.get('NOTE_DIR')}`, { recursive: true });
        filehandle = await fs.open(`${NOTE_DIR}${cfg.get('CURRENT_BRANCH')}.txt`, 'wx'); // wx fails if exist, so may use w 
        
      } catch (e) {
        if (e.code == 'EEXIST') {
          console.log('global directory already exists here. using it now.')
        } else if (e.code=='ENOENT') {
          
          console.log('invalid path provided')
        }else{
          console.log(e)
        }
      } finally {
        if (filehandle !== undefined)
          await filehandle.close();
      }
      // switch branch and all accordingly ...eg. make a master.txt as default
    }else{
      // show contents of config as well 
      console.log(cfg.path)
    }
  })


program
  .command('status ')
  .description('outputs current branch')
  .action(() => {
    console.log(`you are on ${cfg.get('CURRENT_BRANCH')}`);
  })

program
  .command('log ')
  .description('outputs notes on current branch')
  .action(async () => {
    let filehandle;
    try {
      filehandle = await fs.open(`${NOTE_DIR}${CURRENT_BRANCH}.txt`, 'r');
      data = await filehandle.readFile('utf-8');
      console.log(data)
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
    let filehandle;
    if (!newBranch) {
      try {
        filehandle = await fs.readdir(`${NOTE_DIR}`, 'utf-8');
        filehandle.forEach(e => {
          e = e.split('.')[0] // only file(branch) name
          console.log(e);
        })
      } catch (e) {
        console.log('some error occured:', e)
      }
    } else {
      try {
        filehandle = await fs.open(`${NOTE_DIR}${newBranch}.txt`, 'wx'); // wx fails if exist, so may use w 
        // console.log(filehandle)
      } catch (e) {
        if (e.code == 'EEXIST') {
          console.log('branch already exists')
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
  .description('switch to different branch')
  .action((branch) => {             // checkout only branch that exists condn handle to be done
    cfg.set('CURRENT_BRANCH', `${branch}`)
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
        console.log('no such branch');
      } else if (e.errno === 8989) {
        console.log(e.msg);
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