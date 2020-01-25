var repository = null;

exports.setUpPoolConnection = async (r, p) => {
  pool = p;
  repository = r;
};

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
  let inIDQuestion = "";
  let inLastModifiedDateQuestion = "";
  let inIDAnswer = "";
  let inLastModifiedDateAnswer = "";
  let finalResult = {};
  let answerIdNotPresent = [];

  pool.query(repository.getAllUniqueAnswer, (error, uniqueAnswersResult) => {
    if (error) {
      response.status(500).json({ errorMesage: error.message, error: error });
    }
    buildParams(uniqueAnswersResult).then(buildParamsAnswerResult => {
      inIDAnswer = buildParamsAnswerResult.inID;
      inLastModifiedDateAnswer = buildParamsAnswerResult.inLastModifiedDate;

      pool.query(repository.getAllUniqueQuestion, (error, uniqueQuestionsResult) => {
        if (error) {
          response.status(500).json({ errorMesage: error.message, error: error });
        }

        buildParams(uniqueQuestionsResult).then(buildParamsQuestionResult => {
          inIDQuestion = buildParamsQuestionResult.inID;
          inLastModifiedDateQuestion = buildParamsQuestionResult.inLastModifiedDate;
          pool.query("SELECT id FROM public.snapshot_questions WHERE question_id IN " + inIDQuestion + "AND last_modified_date IN " + inLastModifiedDateQuestion, (error, uniqueSnapshotQuestions) => {
            if (error) {
              response.status(500).json({ errorMesage: error.message, error: error });
            }

            uniqueSnapshotQuestions.rows.forEach((snapshotQuestion, snapshotQuestionIndex) => {
              pool.query(repository.countUniqueResultQuestion, [snapshotQuestion.id], (error, numberQuestion) => {
                if (error) {
                  response.status(500).json({ errorMesage: error.message, error: error });
                }

                pool.query(
                  "SELECT id FROM public.snapshot_answers WHERE answer_id IN " + inIDAnswer + " AND last_modified_date IN " + inLastModifiedDateAnswer + " AND current_snapshot_question_id = " + snapshotQuestion.id,
                  (error, uniqueSnapshotAnswerArray) => {
                    if (error) {
                      response.status(500).json({ errorMesage: error.message, error: error });
                    }

                    uniqueSnapshotAnswerArray.rows.forEach((snapshotAnswer, snapshotAnswerIndex) => {
                      pool.query(repository.currentResultPerQuestion, [snapshotAnswer.id, snapshotQuestion.id], (error, resultSurveyPerQuestion) => {
                        if (error) {
                          response.status(500).json({ errorMesage: error.message, error: error });
                        }

                        if (resultSurveyPerQuestion.rows.length > 0) {
                          if (finalResult.hasOwnProperty(resultSurveyPerQuestion.rows[0].testo_domanda)) {
                            finalResult[resultSurveyPerQuestion.rows[0].testo_domanda][resultSurveyPerQuestion.rows[0].testo_risposta] =
                              Math.round((resultSurveyPerQuestion.rows.length / numberQuestion.rows[0].count) * 100 * 100) / 100 + "%";
                          } else {
                            finalResult[resultSurveyPerQuestion.rows[0].testo_domanda] = {
                              [resultSurveyPerQuestion.rows[0].testo_risposta]: Math.round((resultSurveyPerQuestion.rows.length / numberQuestion.rows[0].count) * 100 * 100) / 100 + "%"
                            };
                          }
                        } else {
                          answerIdNotPresent.push(snapshotAnswer.id);
                        }

                        if (snapshotQuestionIndex === uniqueSnapshotQuestions.rows.length - 1 && snapshotAnswerIndex === uniqueSnapshotAnswerArray.rows.length - 1) {
                          if (answerIdNotPresent.length > 0) {
                            answerIdNotPresent.forEach((idAnswerNotPresent, index) => {
                              pool.query(repository.getTestoQuestionAnswerNotPresent, [idAnswerNotPresent], (error, resultNotPresent) => {
                                if (error) {
                                  response.status(500).json({ errorMesage: error.message, error: error });
                                }

                                if (finalResult.hasOwnProperty(resultNotPresent.rows[0].testo_domanda)) {
                                  finalResult[resultNotPresent.rows[0].testo_domanda][resultNotPresent.rows[0].testo_risposta] = "0%";
                                } else {
                                  finalResult[resultNotPresent.rows[0].testo_domanda] = {
                                    [resultNotPresent.rows[0].testo_risposta]: "0%"
                                  };
                                }

                                if (index === answerIdNotPresent.length - 1) {
                                  response.status(200).json(finalResult);
                                }
                              });
                            });
                          } else {
                            response.status(200).json(finalResult);
                          }
                        }
                      });
                    });
                  }
                );
              });
            });
          });
        });
      });
    });
  });

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
};
