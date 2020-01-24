var repository = null;
var pool = null;
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
    client.query("BEGIN", error => {
      shouldAbort(error);

      client.query(repository.deleteAllAnswersByQuestionId, [request.body.id], (error, results) => {
        if (error) {
          shouldAbort(error);
        }
        client.query(repository.deleteQuestionById, [request.body.id], (error, results) => {
          if (error) {
            shouldAbort(error);
          }
          client.query("COMMIT", error => {
            if (error) {
              response.status(500).json({ errorMessage: error.message, error: error });
            }
            release();
            response.status(200).json();
          });
        });
      });
    });
  });
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
      createOrUpdateQuestion = repository.createQuestion;
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
        if (results.rows.length > 0) {
          createSnapshot(client, repository.createSnapshotQuestion, [results.rows[0].testo, fakeUser, results.rows[0].last_modified_date, results.rows[0].id])
            .then(snapshotResult => {
              createOrUpdateAnswers(true, client, snapshotResult[0].id, results.rows[0].id, null, request, fakeUser)
                .then(answersResult => {
                  client.query("COMMIT", error => {
                    if (error) {
                      response.status(500).json({ errorMessage: error.message, error: error });
                    }
                    release();
                    response.status(200).json();
                  });
                })
                .catch(error => {
                  shouldAbort(error);
                });
            })
            .catch(error => {
              shouldAbort(error);
            });
        } else {
          createOrUpdateAnswers(false, client, null, request.body.id, request.body.last_modified_date, request, fakeUser)
            .then(answersResult => {
              client.query("COMMIT", error => {
                if (error) {
                  response.status(500).json({ errorMessage: error.message, error: error });
                }
                release();

                response.status(200).json();
              });
            })
            .catch(error => {
              shouldAbort(error);
            });
        }
      });
    });
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
          insertValue = [value.testo, fakeUser, value.id];
        } else {
          //post risposta
          createOrUpdateAnswer = repository.createAnswer;
          insertValue = [currentQuestionId, value.testo, fakeUser];
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
        let query =  (findById) ? repository.createSnapshotAnswerCurrentTimestamp : repository.createSnapshotAnswer;
        let params =  (findById) ? [resultAnswer.rows[0].testo, fakeUser, resultSnapQuestion.rows[0].id, resultAnswer.rows[0].id] :
         [resultAnswer.rows[0].testo, fakeUser, resultAnswer.rows[0].last_modified_date, resultSnapQuestion.rows[0].id, resultAnswer.rows[0].id];
        createSnapshot(client, query, params)
          .then(snapshotResult => {
            res();
          })
          .catch(error => {
            rej(error);
          });
      });
    } else {
      let query =  (findById) ? repository.createSnapshotAnswerCurrentTimestamp : repository.createSnapshotAnswer;
      let params =  (findById) ? [resultAnswer.rows[0].testo, fakeUser, currentSnapshotQuestionId, resultAnswer.rows[0].id] :
       [resultAnswer.rows[0].testo, fakeUser, resultAnswer.rows[0].last_modified_date,currentSnapshotQuestionId, resultAnswer.rows[0].id];
      createSnapshot(client, query, params)
        .then(snapshotResult => {
          res();
        })
        .catch(error => {
          rej(error);
        });
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
