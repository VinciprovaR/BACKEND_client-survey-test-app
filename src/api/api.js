const express = require("express");
var ContextAPI = require("./context/context");
var router = express.Router();

var api = function(app) {
  for (let c in ContextAPI.context) {
    try {
      let node = ContextAPI.context[c];
      ContextAPI.buildContext(app, node.endPoint, node.controller, router, node.service, node.repository);
  
    } catch (e) {
      console.error(e);
    }
  }
};

module.exports = api;
