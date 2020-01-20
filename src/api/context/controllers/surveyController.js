//var surveyService = require("../services/surveyService");

var survey = function(router, surveyService) {
  router.route("/getAllQuestionAnswer").get((request, response) => {
    surveyService
      .getAllQuestionAnswer()
      .then(result => {
        response.status(200).json(result);
      })
      .catch(error => {
        throw error;
      });
  });

  router.route("/getAllQuestion").get((request, response) => {
    surveyService
      .getAllQuestion()
      .then(result => {
        response.status(200).json(result);
      })
      .catch(error => {
        throw error;
      });
  });

  return router;
};

module.exports = survey;
