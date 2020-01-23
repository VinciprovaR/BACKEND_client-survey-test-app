const express = require('express');
const router = express.Router();

exports.setUpRoute = async function(service) {
  
  router.get("/getAllQuestionAndAnswer", service.getAllQuestionAndAnswer);
  router.get("/getAllQuestions", service.getAllQuestions);
  router.put("/updateQuestion", service.createOrUpdateQuestion);
  router.post("/createQuestion", service.createOrUpdateQuestion);

  return router; 
};

