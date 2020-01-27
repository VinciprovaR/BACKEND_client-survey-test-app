var repository = null;
var pool = null;

async function createConnectionIstance() {
  return new Promise((res, rej) => {
    pool.connect((error, client, release) => {
      const shouldAbort = (error, client, release, response) => {
        if (error) {
          console.error("Error in transaction", error.message);
          client.query("ROLLBACK", errorRB => {
            if (errorRB) {
              console.error("Error rolling back client", errorRB.message);
              console.log("===RELEASE===");
              release();
              response.status(500).json({ errorMessage: errorRB.message, error: errorRB });
            }
            console.log("===RELEASE===");
            release();
            response.status(500).json({ errorMessage: error.message, error: error });
          });
        }
      };
      if (error) {
        rej({ shouldAbort: shouldAbort, client: client, release: release, error: error });
      } else {
        res({ shouldAbort: shouldAbort, client: client, release: release });
      }
    });
  });
}


exports.setUpPoolConnection = async (r, p) => {
  pool = p;
  repository = r;
};

exports.getAllQuestionAndAnswer = async (request, response) => {
  createConnectionIstance()
  .then(connOK => {
    let client = connOK.client;
    let shouldAbort = connOK.shouldAbort;
    let release = connOK.release;
    client.query("BEGIN", error => {
      if (error) {
        shouldAbort(error, client, release, response);
      }
 
      client.query(repository.getAllQuestions, (error, results) => {
        if (error) {
          response.status(500).json({ errorMesage: error.message, error: error });
        }
        let fullResult = [];
        if (results.rows.length > 0) {
          results.rows.forEach((question, index) => {
            client.query(repository.getAnswerByQuestionId, [question.id], (error, resultsAnswer) => {
              if (error) {
                release();
                response.status(500).json({ errorMesage: error.message, error: error });
              }
              question["allAnswers"] = resultsAnswer.rows;
              fullResult.push(question);
              if (index === results.rows.length - 1) {

                client.query("COMMIT", error => {
                  if (error) {
                    release();
                    response.status(500).json({ errorMessage: error.message, error: error });
                  }
                  console.log("===RELEASE===");
                  release();
                  response.status(200).json(fullResult);
                });

             
              }
            });
          });
        } else {
          client.query("COMMIT", error => {
            if (error) {
              response.status(500).json({ errorMessage: error.message, error: error });
            }
            release();
            response.status(200).json([]);
          });
        }
      });
    })

  })



};

exports.getAllQuestions = async (request, response) => {

    pool.query(repository.getAllQuestions, (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error: error });
      }
      response.status(200).json(results.rows);
    });

};

