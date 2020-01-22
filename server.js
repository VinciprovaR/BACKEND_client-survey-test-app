
const dotenv = require("dotenv");
const Pool = require("pg").Pool;
const appModule = require("./src/app");

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
    console.log("Server is running on port: " + port);
  });
}

setUpServer();
