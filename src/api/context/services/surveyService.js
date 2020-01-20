const Pool = require("pg").Pool;
var repository = null;

const pool = new Pool({
  user: "admin_survey",
  host: "192.168.1.100",
  database: "client_surveys",
  password: "admin_survey",
  port: 5432
});

async function setUpRepository(r){
  repository = r;
}

function getAllQuestionAnswer() {
  return new Promise((resolve, reject) => {
    pool.query(repository.getAllQuestions, (error, results) => {
      if (error) {
        reject(error);
      }
      let fullResult = [];
      results.rows.forEach((value, index) => {
        pool.query(repository.getAnswerById + value.id, (error, resultsAnswer) => {
          if (error) {
            throw error;
          }
          value["allAnswers"] = resultsAnswer.rows;
          fullResult.push(value);
          if (index === results.rows.length - 1) {
            resolve(fullResult);
          }
        });
      });
    });
  });
}

async function getAllQuestion() {
  return new Promise((resolve, reject) => {
    pool.query(repository.getAllQuestions, (error, results) => {
      if (error) {
        reject(error);
      }
      resolve(results.rows);
    });
  });
}

module.exports = {
  setUpRepository: setUpRepository,
  getAllQuestionAnswer: getAllQuestionAnswer,
  getAllQuestion: getAllQuestion
};
