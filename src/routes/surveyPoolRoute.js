const express = require('express');
const router = express.Router();

exports.setUpRoute = async function(service) {
  
  router.get("/getAllQuestionAndAnswer", service.getAllQuestionAndAnswer);
  router.get("/getAllQuestions", service.getAllQuestions);
  
  return router; 
};

