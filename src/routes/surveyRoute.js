const express = require('express');
const router = express.Router();

exports.setUpRoute = async function(service) {

  router.put("/updateQuestion", service.createOrUpdateQuestion);
  router.post("/createQuestion", service.createOrUpdateQuestion);
  router.delete("/deleteQuestion", service.deleteQuestion);
  router.post("/createResultSurvey", service.createResultSurvey);
  
  return router; 
};

