const { program } = require('commander');
const fs=require("fs").promises
program.version('0.0.1');

program
    .option('-d, --debug', 'output extra debugging')
    .option('-s, --small', 'small pizza size')
    .option('-p, --pizza-type <type>', 'flavour of pizza')
    .option('-c, --cheese <type>', 'add the specified type of cheese');

program
  .command('log ')
  .description('logs your notes')
  .action(async () =>{
    let filehandle;
    try {
      filehandle = await fs.open('/home/pg07codes/notes/notes1.txt', 'r');
      data=await filehandle.readFile('utf-8');
      console.log(data)
    } finally {
      if (filehandle !== undefined)
        await filehandle.close();
    }
  })
    

      
        

program
  .command('start <service>', 'start named service')
  .command('stop [service]', 'stop named service, or all if no name supplied');


program.parse(process.argv);

if (program.debug) console.log(program.opts());
if (program.small) console.log('- small pizza size');
if (program.pizzaType) console.log(`- ${program.pizzaType}`);
if (program.cheese) console.log(`cheese: ${program.cheese}`);