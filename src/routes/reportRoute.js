const express = require('express');
const router = express.Router();

exports.setUpRoute = async function(service) {

  router.get("/getAllReportResult", service.getAll);
  router.get("/calculateCurrentReport", service.calculateCurrentReport);
  
  return router; 

};

