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
      if (results.rows.length > 0) {
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
      } else {
        response.status(200).json([]);
      }
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

exports.deleteQuestion = async (request, response) => {
  createConnectionIstance()
    .then(connOK => {
      let client = connOK.client;
      let shouldAbort = connOK.shouldAbort;
      let release = connOK.release;
      client.query("BEGIN", error => {
        if (error) {
          shouldAbort(error, client, release, response);
        }
        client.query(repository.deleteAllAnswersByQuestionId, [request.body.id], (error, results) => {
          if (error) {
            shouldAbort(error, client, release, response);
          }
          client.query(repository.deleteQuestionById, [request.body.id], (error, results) => {
            if (error) {
              shouldAbort(error, client, release, response);
            }
            client.query("COMMIT", error => {
              if (error) {
                response.status(500).json({ errorMessage: error.message, error: error });
              }
              console.log("===RELEASE===");
              release();
              response.status(200).json();
            });
          });
        });
      });
    })
    .catch(connKO => {
      connKO.shouldAbort(connKO.error, connKO.client, connKO.release, connKO.response);
    });
};

exports.createResultSurvey = async (request, response) => {
  createConnectionIstance()
    .then(connOK => {
      let fakeUser = request.headers.clientHost || "user_" + new Date().getUTCMilliseconds() + new Date().getUTCSeconds();
      let client = connOK.client;
      let shouldAbort = connOK.shouldAbort;
      let release = connOK.release;

      client.query("BEGIN", error => {
        if (error) {
          shouldAbort(error, client, release, response);
        }

        client.query(repository.createResultUser, [fakeUser], (error, userCreated) => {
          if (error) {
            shouldAbort(error, client, release, response);
          }
          let resultUserId = userCreated.rows[0].id;
          request.body.resultSurvey.forEach((value, index) => {
            client.query(repository.findSnapQuestionId, [value.id, value.last_modified_date], (error, sqID) => {
              if (error) {
                shouldAbort(error, client, release, response);
              }

              let snapQuestionId = sqID.rows[0].id;
              client.query(repository.findSnapAnswerId, [value.answer.id], (error, saID) => {
                if (error) {
                  shouldAbort(error, client, release, response);
                }

                let snapAnswerId = saID.rows[0].id;
                client.query(repository.createResultUserSurvey, [resultUserId, snapQuestionId, snapAnswerId, fakeUser], (error, finalResultSurvey) => {
                  if (error) {
                    shouldAbort(error, client, release, response);
                  }
                  if (index === request.body.resultSurvey.length - 1) {
                    client.query("COMMIT", error => {
                      if (error) {
                        response.status(500).json({ errorMessage: error.message, error: error });
                      }
                      console.log("===RELEASE===");
                      release();
                      response.status(200).json();
                    });
                  }
                });
              });
            });
          });
        });
      });
    })
    .catch(connKO => {
      connKO.shouldAbort(connKO.error, connKO.client, connKO.release, connKO.response);
    });
};

exports.createOrUpdateQuestion = async (request, response) => {
  createConnectionIstance()
    .then(connOK => {
      let fakeUser = request.headers.clientHost || "anonymous";
      let createOrUpdateQuestion = null;
      let insertValue = null;
      let client = connOK.client;
      let shouldAbort = connOK.shouldAbort;
      let release = connOK.release;

      if (request.method === "POST") {
        createOrUpdateQuestion = repository.createQuestion;
        insertValue = [request.body.testo_domanda, fakeUser];
      } else if (request.method === "PUT") {
        createOrUpdateQuestion = repository.updateQuestion;
        insertValue = [request.body.testo_domanda, fakeUser, request.body.id];
      }

      client.query("BEGIN", error => {
        if (error) {
          shouldAbort(error, client, release, response);
        }
        client.query(createOrUpdateQuestion, insertValue, async (error, results) => {
          if (error) {
            shouldAbort(error, client, release, response);
          }
          if (results.rows.length > 0) {
            createSnapshot(client, repository.createSnapshotQuestion, [results.rows[0].testo_domanda, fakeUser, results.rows[0].last_modified_date, results.rows[0].id])
              .then(snapshotResult => {
                createOrUpdateAnswers(true, client, snapshotResult[0].id, results.rows[0].id, null, request, fakeUser)
                  .then(answersResult => {
                    client.query("COMMIT", error => {
                      if (error) {
                        response.status(500).json({ errorMessage: error.message, error: error });
                      }
                      console.log("===RELEASE===");
                      release();
                      response.status(200).json();
                    });
                  })
                  .catch(error => {
                    shouldAbort(error, client, release, response);
                  });
              })
              .catch(error => {
                shouldAbort(error, client, release, response);
              });
          } else {
            createOrUpdateAnswers(false, client, null, request.body.id, request.body.last_modified_date, request, fakeUser)
              .then(answersResult => {
                client.query("COMMIT", error => {
                  if (error) {
                    response.status(500).json({ errorMessage: error.message, error: error });
                  }
                  console.log("===RELEASE===");
                  release();

                  response.status(200).json();
                });
              })
              .catch(error => {
                shouldAbort(error, client, release, response);
              });
          }
        });
      });
    })
    .catch(connKO => {
      connKO.shouldAbort(connKO.error, connKO.client, connKO.release, connKO.response);
    });
};

async function createOrUpdateAnswers(questionIsChanged, client, currentSnapshotQuestionId, currentQuestionId, currentQuestionLastModifiedDate, request, fakeUser) {
  return new Promise((res, rej) => {
    if (request.body.allAnswers.length > 0) {
      let createOrUpdateAnswer = null;
      let insertValue = null;
      request.body.allAnswers.forEach((value, index) => {
        if (value.id != null) {
          //put risposta
          createOrUpdateAnswer = repository.updateAnswer;
          insertValue = [value.testo_risposta, fakeUser, value.id];
        } else {
          //post risposta
          createOrUpdateAnswer = repository.createAnswer;
          insertValue = [currentQuestionId, value.testo_risposta, fakeUser];
        }
        if (value.delete) {
          client.query(repository.deleteAnswer, [value.id], async (error, resultDelete) => {
            if (error) {
              rej(error);
            }
            if (index === request.body.allAnswers.length - 1) {
              res();
            }
          });
        } else {
          client.query(createOrUpdateAnswer, insertValue, async (error, resultAnswer) => {
            if (error) {
              rej(error);
            }
            if ((questionIsChanged && resultAnswer.rows.length >= 0) || (!questionIsChanged && resultAnswer.rows.length > 0)) {
              if (resultAnswer.rows.length === 0) {
                client.query(repository.findAnswerById, [value.id], async (error, resultFindAnswers) => {
                  if (error) {
                    rej(error);
                  }
                  //se il testo della risposta NON è stato modificato
                  middelwareSnapshot(true, resultFindAnswers, currentSnapshotQuestionId, currentQuestionLastModifiedDate, client, fakeUser)
                    .then(midRes => {
                      if (index === request.body.allAnswers.length - 1) {
                        res();
                      }
                    })
                    .catch(error => {
                      rej(error);
                    });
                });
              } else {
                //se il testo della risposta è stato modificato
                middelwareSnapshot(false, resultAnswer, currentSnapshotQuestionId, currentQuestionLastModifiedDate, client, fakeUser)
                  .then(midRes => {
                    if (index === request.body.allAnswers.length - 1) {
                      res();
                    }
                  })
                  .catch(error => {
                    rej(error);
                  });
              }
            } else {
              if (index === request.body.allAnswers.length - 1) {
                res();
              }
            }
          });
        }
      });
    } else {
      res();
    }
  });
}

async function middelwareSnapshot(findById, resultAnswer, currentSnapshotQuestionId, currentQuestionLastModifiedDate, client, fakeUser) {
  return new Promise((res, rej) => {
    if (currentSnapshotQuestionId === null) {
      client.query(repository.findLastSnapshotQuestionOfAnswer, [currentQuestionLastModifiedDate], async (error, resultSnapQuestion) => {
        if (error) {
          rej(error);
        }
        //se la domanda è nuova
        let query = findById ? repository.createSnapshotAnswerCurrentTimestamp : repository.createSnapshotAnswer;
        let params = findById
          ? [resultAnswer.rows[0].testo_risposta, fakeUser, resultSnapQuestion.rows[0].id, resultAnswer.rows[0].id]
          : [resultAnswer.rows[0].testo_risposta, fakeUser, resultAnswer.rows[0].last_modified_date, resultSnapQuestion.rows[0].id, resultAnswer.rows[0].id];
        createSnapshot(client, query, params)
          .then(snapshotResult => {
            res();
          })
          .catch(error => {
            rej(error);
          });
      });
    } else {
      //se la domanda è modificata
      let query = findById ? repository.createSnapshotAnswerCurrentTimestamp : repository.createSnapshotAnswer;
      let params = findById
        ? [resultAnswer.rows[0].testo_risposta, fakeUser, currentSnapshotQuestionId, resultAnswer.rows[0].id]
        : [resultAnswer.rows[0].testo_risposta, fakeUser, resultAnswer.rows[0].last_modified_date, currentSnapshotQuestionId, resultAnswer.rows[0].id];

      client.query(repository.updateAnswerLastModifiedDate, [fakeUser, resultAnswer.rows[0].id], async (error, resultAnswerLastModifiedDate) => {
        if (error) {
          rej(error);
        }
        createSnapshot(client, query, params)
          .then(snapshotResult => {
            res();
          })
          .catch(error => {
            rej(error);
          });
      });
    }
  });
}
