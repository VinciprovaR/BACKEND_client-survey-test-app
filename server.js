
const dotenv = require("dotenv");
const pg = require('pg')
const appModule = require("./src/app");
const Pool = pg.Pool;

var types = require('pg').types;
var timestampOID = 1114;
types.setTypeParser(timestampOID, function(stringValue) {
  return stringValue;
})


async function setUpServer() {
  
  dotenv.config();
  const port = process.env.PORT;

  var pool = new Pool({
    user: process.env.USER_DB,
    host: process.env.HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT

  });

  const app = await appModule.bootStrapApp(pool);

  app.listen(port, () => {
    console.log("Server is running on port: " + port + " " + new Date());
  });
}

setUpServer();
