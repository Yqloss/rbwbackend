const sqlite = require('sqlite3');

let database = new sqlite.Database('./config/rbw.db');

// database.run(`insert into player values(0,'IAFEnvoy','uuid',0,0,0,0,0,0,0)`);
database.each(`select count(*) from player`, () => {},(err,cnt)=>console.log(cnt));