const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
let api = require("./api/api");
const app = express();

//PORTA VA IN CONFING
console.log(dotenv.config())
const port = process.env.PORT;

async function startServer() {
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  api(app);

  app.listen(port, () => {
    console.log("Server is running on port: " + port);
  });
}

startServer();
