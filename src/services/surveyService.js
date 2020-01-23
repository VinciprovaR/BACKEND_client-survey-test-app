var repository = null;

exports.setUpPoolConnection = async (r, p) => {
  pool = p;
  repository = r;
};

exports.getAllQuestionAndAnswer = async (request, response) => {
  try {
    pool.query(repository.getAllQuestions, (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error: error });
      }
      let fullResult = [];
      results.rows.forEach((question, index) => {
        pool.query(repository.getAnswerByQuestionId, [question.id], (error, resultsAnswer) => {
          if (error) {
            response.status(500).json({ errorMesage: error.message, error: error });
          }
          question["allAnswers"] = resultsAnswer.rows;
          fullResult.push(question);
          if (index === results.rows.length - 1) {
            response.status(200).json(fullResult);
          }
        });
      });
    });
  } catch (error) {
    response.status(500).json({ errorMesage: error.message, error: error });
  }
};

exports.getAllQuestions = async (request, response) => {
  try {
    pool.query(repository.getAllQuestions, (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error: error });
      }
      response.status(200).json(results.rows);
    });
  } catch (error) {
    response.status(500).json({ errorMesage: error.message, error: error });
  }
};


exports.createOrUpdateQuestion = async (request, response) => {
  let fakeUser = request.headers.clientHost || "anonymous";
  let createOrUpdateQuestion = null;
  let insertValue = null;

  pool.connect((error, client, release) => {
    const shouldAbort = error => {
      if (error) {
        console.error("Error in transaction", error.message);
        client.query("ROLLBACK", errorRB => {
          if (errorRB) {
            console.error("Error rolling back client", errorRB.message);
            release();
            response.status(500).json({ errorMessage: errorRB.message, error: errorRB });
          }
          release();
          response.status(500).json({ errorMessage: error.message, error: error });
        });
      }
    };

    if (error) {
      shouldAbort(error);
    }

    if (request.method === "POST") {
      createOrUpdateQuestion= repository.createQuestion;
      insertValue = [request.body.testo, fakeUser];
    } else if (request.method === "PUT") {
      createOrUpdateQuestion = repository.updateQuestion;
      insertValue = [request.body.testo, fakeUser, request.body.id];
    }


    client.query("BEGIN", error => {
      shouldAbort(error);

      client.query(createOrUpdateQuestion, insertValue, async (error, results) => {
        if (error) {
          shouldAbort(error);
        }
        if(results.rows.length > 0){
          createSnapshot(client, repository.createSnapshotQuestion, [results.rows[0].testo, fakeUser, results.rows[0].last_modified_date, results.rows[0].id])
          .then(snapshotResult => {

            createOrUpdateAnswers(client, {questionId: snapshotResult[0].current_question_id, lastModifiedDateQuestion: results.rows[0].last_modified_date}, request, fakeUser).then(answersResult =>{

              client.query("COMMIT", error => {
                if (error) {
                  response.status(500).json({ errorMessage: error.message, error: error });
                }
                release();
                response.status(200).json(snapshotResult);//TODO MODIFICARE anche risposte
              });

            }).catch(error=>{
              shouldAbort(error);
            });

    
          })

          .catch(error => {
            shouldAbort(error);
          });
        }
        else{
          console.log("domanda non modificata")
          createOrUpdateAnswers(client, {questionId: request.body.id, lastModifiedDateQuestion: request.body.last_modified_date}, request, fakeUser).then(answersResult =>{

            client.query("COMMIT", error => {
              if (error) {
                response.status(500).json({ errorMessage: error.message, error: error });
              }
              release();
              response.status(200).json(answersResult);//TODO MODIFICARE anche risposte
            });
          }).catch(error =>{
            shouldAbort(error);
          });
        }
      });
    });
  });
};

async function createOrUpdateAnswers(client, resultQuestion, request, fakeUser){
  return new Promise((res, rej)=> {
    if(request.body.allAnswers.length > 0){
      console.log("devo creare/modificare risposte")
      let createOrUpdateAnswer = null;
      let insertValue = null;
      request.body.allAnswers.forEach((value, index)=>{
        if(value.id != null){
          //put risposta
          console.log("put risposta")
          createOrUpdateAnswer= repository.updateAnswer;
          insertValue = [value.testo, fakeUser, value.id];
        }
        else{
          //post risposta
          createOrUpdateAnswer = repository.createAnswer;
          insertValue = [resultQuestion.questionId, value.testo, fakeUser];
        }

        client.query(createOrUpdateAnswer, insertValue, async (error, results) => {
          if (error) {
            rej(error);
          }


          if(results.rows.length > 0){
            
            client.query(repository.findLastSnapshotQuestionOfAnswer, [results.rows[0].question_id, resultQuestion.lastModifiedDateQuestion], async (error, lastSnapQuestion) => {
              if (error) {
                rej(error);
              }

           
              console.log([results.rows[0].question_id, resultQuestion.lastModifiedDateQuestion])
          createSnapshot(client, repository.createSnapshotAnswer, [results.rows[0].testo, fakeUser, results.rows[0].last_modified_date, 
            results.rows[0].id, results.rows[0].question_id, lastSnapQuestion.rows[0].id])
          .then(snapshotResult => {
            console.log("effettuato snapshot risposta")
            if(index === (request.body.allAnswers.length -1)){
              res({message: "Terminato con snapshot risposte"});
            }
      


          }).catch(error=>{
            rej(error);
          });
        });
        }
        else{
          if(index === (request.body.allAnswers.length -1)){
            res({message: "Terminato con snapshot risposte"});
          }
        }
        });
      })

 
    }
    else{
      console.log("NON devo creare/modificare risposte")
      res(request.body.allAnswers);
    }
  });
}


async function createSnapshot(client, repository, arrayParams) {
  return new Promise((res, rej) => {
    client.query(repository, arrayParams, (error, results) => {
      if (error) {
        rej(error);
      } else {
        res(results.rows);
      }
    });
  });
}
