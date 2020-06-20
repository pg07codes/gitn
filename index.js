const { program } = require('commander');
const fs = require("fs").promises
program.version('0.0.1');


// ---------config store code
const Configstore = require('configstore');
const cfg = new Configstore("gitn", {init: false});
let NOTE_DIR=cfg.get('NOTE_DIR');
let CURRENT_BRANCH=cfg.get('CURRENT_BRANCH');

 
// ----config store code
program
  .command('status ')
  .description('outputs current branch')
  .action(() => {
    console.log(`you are on ${CURRENT_BRANCH}`);
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
          console.log(e);
        })
      } catch (e) {
        console.log('some error occured:', e)
      }
    } else {
      try {
        filehandle = await fs.open(`${NOTE_DIR}${newBranch}.txt`,'wx'); // wx fails if exist, so may use w 
        // console.log(filehandle)
      } finally {
        if (filehandle !== undefined)
          await filehandle.close();
      }
    }

  })


program
  .command('checkout <branch>')
  .description('switch to different branch')
  .action( (branch) => {
    cfg.set('CURRENT_BRANCH',`${branch}`)
  })


// program
//   .command('checkout')
//   .action(async (arg) => {
//     let filehandle;
//     try {
//       filehandle = await fs.readdir(`${NOTE_DIR}`, 'utf-8');
//       filehandle.forEach(e => {
//         console.log(e);
//       })
//     } catch (e) {
//       console.log('some error occured:', e)
//     }

//   })



program.parse(process.argv);