var surveyController = require("./controllers/surveyController");
var surveyService = require("./services/surveyService");
var surveyRepository = require("./repository/surveyRepository");

var context = {
    survey: {
        endPoint: "/survey",
        controller: surveyController,
        service: surveyService,
        repository: surveyRepository
    }
}

var buildContext = async function(app, endPoint, controller, router, service, repository){
    await service.setUpRepository(repository);
    router = controller(router, service);
    app.use(endPoint, router);
}


module.exports = {
    context: context,
    buildContext: buildContext
};