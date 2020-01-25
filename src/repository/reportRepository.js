module.exports  = {
    getAllReportResult: "SELECT * FROM public.results_users_questions_answers",
    getTestoQuestionAnswerNotPresent: "select  testo_domanda, testo_risposta from public.snapshot_answers SA inner join public.snapshot_questions SQ\
    on SA.current_snapshot_question_id = SQ.id where SA.id = $1",
    countUniqueResultQuestion: "SELECT COUNT(id) FROM public.results_users_questions_answers WHERE snapshot_question_id = $1",
    getAllUniqueAnswer: "SELECT id, last_modified_date FROM public.answers", //THIS
    getAllUniqueQuestion: "SELECT id,last_modified_date FROM public.questions",
    currentSnapshotAnswer: "SELECT id FROM public.snapshot_answers WHERE last_modified_date IN ($1) AND answer_id IN ($2) AND current_snapshot_question_id = $3",
    currentResultPerQuestion: "SELECT SQ.testo_domanda, SA.testo_risposta from public.results_users_questions_answers RES INNER JOIN snapshot_answers SA ON RES.snapshot_answer_id = SA.id\
    INNER JOIN snapshot_questions SQ ON RES.snapshot_question_id = SQ.id WHERE RES.snapshot_answer_id = $1 AND RES.snapshot_question_id = $2"

}
