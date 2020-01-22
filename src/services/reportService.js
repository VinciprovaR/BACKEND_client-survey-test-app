var repository = null;

exports.setUpPoolConnection = async (r,p) => {
  pool = p;
  repository = r;
};

exports.getAll = async (request, response) => {
  try {
    pool.query(repository.getAllReportResult, (error, results) => {
      if (error) {
        response.status(500).json({errorMesage: error.message, error});
      }
      response.status(200).json(results.rows);
    });
  } catch (error) {
    response.status(500).json({errorMesage: error.message, error});
  }
};
