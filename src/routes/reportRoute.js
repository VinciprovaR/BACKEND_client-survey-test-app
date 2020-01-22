const express = require('express');
const router = express.Router();

exports.setUpRoute = async function(service) {

  router.get("/getAllReportResult", service.getAll);
  
  return router; 

};

