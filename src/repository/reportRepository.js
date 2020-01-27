module.exports  = {
    getAllQuestionId: "SELECT id FROM public.questions",
    getSetAnswerId: "SELECT id FROM public.answers WHERE question_id = $1",
    getAllReportResult: "SELECT * FROM public.results_users_questions_answers",
    getTestoQuestionAnswerNotPresent: "select testo_domanda, testo_risposta from public.answers A inner join public.questions Q\
    on A.question_id = Q.id where A.id = $1",
    countUniqueResultQuestion: "SELECT COUNT(id) FROM public.results_users_questions_answers WHERE question_id = $1",
    getAllUniqueAnswer: "SELECT id, last_modified_date FROM public.answers", //THIS
    getAllUniqueQuestion: "SELECT id,last_modified_date FROM public.questions",
    currentSnapshotAnswer: "SELECT id FROM public.snapshot_answers WHERE last_modified_date IN ($1) AND answer_id IN ($2) AND current_snapshot_question_id = $3",
    currentResultPerQuestion: "SELECT Q.testo_domanda, A.testo_risposta FROM public.results_users_questions_answers RES INNER JOIN answers A ON RES.answer_id = A.id\
    INNER JOIN questions Q ON RES.question_id = Q.id WHERE RES.answer_id = $1 AND RES.question_id = $2"

}
