const express = require('express');
const router = express.Router();

exports.setUpRoute = async function(service) {
  
  router.get("/getAllQuestionAndAnswer", service.getAllQuestionAndAnswer);

  router.get("/getAllQuestion", service.getAllQuestion);
  router.put("/updateQuestion", service.updateQuestion);
  router.post("/createQuestion", service.createQuestion);

  return router; 
};

