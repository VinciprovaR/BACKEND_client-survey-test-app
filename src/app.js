
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");


var context = {
  survey: {
    endPoint: "/survey",
    route: require("./routes/surveyRoute"),
    service: require("./services/surveyService"),
    repository: require("./repository/surveyRepository")
  },
  report: {
    endPoint: "/report",
    route: require("./routes/reportRoute"),
    service: require("./services/reportService"),
    repository: require("./repository/reportRepository")
  }
};

exports.bootStrapApp = async function(pool){

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  for (let c in context) {
    try {
      context[c].service.setUpPoolConnection(context[c].repository, pool);
      let router = await context[c].route.setUpRoute(context[c].service);
      app.use(context[c].endPoint, router);
    } catch (e) {
      console.error(e);
    }
  }
  return app;
};

