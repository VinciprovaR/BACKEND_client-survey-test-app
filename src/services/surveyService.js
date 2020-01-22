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

exports.getAllQuestion = async (request, response) => {
  try {
    pool.query(repository.getAllQuestions(), (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error: error });
      }
      response.status(200).json(results.rows);
    });
  } catch (error) {
    response.status(500).json({ errorMesage: error.message, error: error });
  }
};

exports.updateQuestion = async (request, response) => {
  try {
    pool.query(repository.updateQuestion, [request.body.testo, request.headers.clientHost || "anonymous", request.body.id], async (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error: error });
      }
      createSnapshot(repository.createSnapshotQuestion, results.rows[0], request.headers.clientHost || "anonymous")
        .then(snapshotResult => {
          response.status(200).json(snapshotResult.result);
        })
        .catch(snapshotResult => {
          response.status(500).json(snapshotResult.error);
        });
    });
  } catch (error) {
    response.status(500).json({ errorMesage: error.message, error: error });
  }
};

exports.createQuestion = async (request, response) => {
  try {
    pool.query(repository.createQuestion, [request.body.testo, request.headers.clientHost || "anonymous"], async (error, results) => {
      if (error) {
        response.status(500).json({ errorMesage: error.message, error: error });
      }
      createSnapshot(repository.createSnapshotQuestion, results.rows[0], request.headers.clientHost || "anonymous")
        .then(snapshotResult => {
          response.status(200).json(snapshotResult.result);
        })
        .catch(snapshotResult => {
          response.status(500).json(snapshotResult.error);
        });
    });
  } catch (error) {
    response.status(500).json({ errorMesage: error.message, error: error });
  }
};

async function createSnapshot(repository, updateCreateResult, host) {
  return new Promise((res, rej) => {
    pool.query(repository, [updateCreateResult.testo, host, updateCreateResult.last_modified_date, updateCreateResult.id], (error, results) => {
      if (error) {
        rej({
          isError: true,
          error: { errorMesage: error.message, error: error },
          result: ""
        });
      }
      res({
        isError: false,
        error: "",
        result: results.rows
      });
    });
  });
}
