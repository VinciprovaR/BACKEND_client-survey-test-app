var repository = null;

exports.setUpPoolConnection = async (r, p) => {
  pool = p;
  repository = r;
};

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

exports.getAll = async (request, response) => {
  try {
    pool.query(repository.getAllReportResult, (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error });
      }
      response.status(200).json(results.rows);
    });
  } catch (error) {
    response.status(500).json({ errorMesage: error.message, error });
  }
};

exports.calculateCurrentReport = async (request, response) => {
  let finalResult = {};
  let answerIdNotPresent = [];

  createConnectionIstance().then(connOK => {
    let client = connOK.client;
    let shouldAbort = connOK.shouldAbort;
    let release = connOK.release;
    client.query("BEGIN", error => {
      if (error) {
        shouldAbort(error, client, release, response);
      }
      client.query(repository.getAllQuestionId, (error, allQuestionID) => {
        if (error) {
          response.status(500).json({ errorMesage: error.message, error: error });
        }

        allQuestionID.rows.forEach((idQuestion, indexQuestion) => {
          client.query(repository.countUniqueResultQuestion, [idQuestion.id], (error, numberQuestion) => {
            if (error) {
              response.status(500).json({ errorMesage: error.message, error: error });
            }

            client.query(repository.getSetAnswerId, [idQuestion.id], (error, setAnswerID) => {
              if (error) {
                response.status(500).json({ errorMesage: error.message, error: error });
              }

              setAnswerID.rows.forEach((idAnswer, indexAnswer) => {
                client.query(repository.currentResultPerQuestion, [idAnswer.id, idQuestion.id], (error, resultSurveyPerQuestion) => {
                  if (error) {
                    response.status(500).json({ errorMesage: error.message, error: error });
                  }

                  if (resultSurveyPerQuestion.rows.length > 0) {
                    if (finalResult.hasOwnProperty(resultSurveyPerQuestion.rows[0].testo_domanda)) {
                      finalResult[resultSurveyPerQuestion.rows[0].testo_domanda][resultSurveyPerQuestion.rows[0].testo_risposta] =
                        Math.round((resultSurveyPerQuestion.rows.length / numberQuestion.rows[0].count) * 100 * 100) / 100;
                    } else {
                      finalResult[resultSurveyPerQuestion.rows[0].testo_domanda] = {
                        [resultSurveyPerQuestion.rows[0].testo_risposta]: Math.round((resultSurveyPerQuestion.rows.length / numberQuestion.rows[0].count) * 100 * 100) / 100
                      };
                    }
                  } else {
                    answerIdNotPresent.push(idAnswer.id);
                  }

                  if (indexQuestion === allQuestionID.rows.length - 1 && indexAnswer === setAnswerID.rows.length - 1) {
                    if (answerIdNotPresent.length > 0) {
                      answerIdNotPresent.forEach((idAnswerNotPresent, index) => {
                        client.query(repository.getTestoQuestionAnswerNotPresent, [idAnswerNotPresent], (error, resultNotPresent) => {
                          if (error) {
                            response.status(500).json({ errorMesage: error.message, error: error });
                          }

                          if (finalResult.hasOwnProperty(resultNotPresent.rows[0].testo_domanda)) {
                            finalResult[resultNotPresent.rows[0].testo_domanda][resultNotPresent.rows[0].testo_risposta] = "0";
                          } else {
                            finalResult[resultNotPresent.rows[0].testo_domanda] = {
                              [resultNotPresent.rows[0].testo_risposta]: "0"
                            };
                          }

                          if (index === answerIdNotPresent.length - 1) {
                            client.query("COMMIT", error => {
                              if (error) {
                                response.status(500).json({ errorMessage: error.message, error: error });
                              }
                              release();
                              response.status(200).json(finalResult);
                            });
                          }
                        });
                      });
                    } else {
                      client.query("COMMIT", error => {
                        if (error) {
                          response.status(500).json({ errorMessage: error.message, error: error });
                        }
                        console.log("===RELEASE===");
                        release();
                        response.status(200).json(finalResult);
                      });
                    }
                  }
                });
              });
            });
          });
        });
      });
    });
  });
};

async function buildParams(array) {
  return new Promise((res, rej) => {
    let inID = "";
    let inLastModifiedDate = "";
    array.rows.forEach((element, index) => {
      if (index === 0) {
        inID += "(";
        inLastModifiedDate += "(";
      }
      if (index === array.rows.length - 1) {
        inID += element.id + ")";
        inLastModifiedDate += "'" + element.last_modified_date + "')";
        res({ inID: inID, inLastModifiedDate: inLastModifiedDate });
      } else {
        inID += element.id + ",";
        inLastModifiedDate += "'" + element.last_modified_date + "',";
      }
    });
  });
}
