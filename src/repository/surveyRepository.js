module.exports = {
  getAllQuestions: "SELECT * FROM public.questions",
  getAllAnswers: "SELECT * FROM public.answers",
  findAnswerById: "SELECT * FROM public.answers WHERE id = $1",
  getAnswerByQuestionId: "SELECT * FROM public.answers where question_id = $1",
  updateQuestion: "UPDATE public.questions SET testo_domanda = $1, last_modified_by = $2 WHERE id = $3 AND testo_domanda != $1\
  RETURNING *",
  createQuestion: "INSERT INTO public.questions\
  (id, testo_domanda, created_by, last_modified_by)\
  VALUES(nextval('questions_sequence'), $1, $2, $2)\
  RETURNING *",
  deleteQuestionById: "DELETE FROM public.questions WHERE id = $1",
  updateAnswer: "UPDATE public.answers SET testo_risposta = $1 , last_modified_by = $2 WHERE id = $3 AND testo_risposta != $1\
  RETURNING *",
  updateAnswerLastModifiedDate: "UPDATE public.answers SET last_modified_date = current_timestamp, last_modified_by = $1 WHERE id = $2 \
  RETURNING *",
  createAnswer: "INSERT INTO public.answers\
  (id, question_id, testo_risposta, created_by, last_modified_by)\
  VALUES(nextval('answers_sequence'), $1, $2, $3, $3)\
  RETURNING *",
  deleteAnswer: "DELETE FROM public.answers WHERE id = $1",
  deleteAllAnswersByQuestionId: "DELETE FROM public.answers WHERE question_id = $1",
  findLastSnapshotQuestionOfAnswer: "SELECT id FROM public.snapshot_questions WHERE created_date = $1",
  createSnapshotAnswer:
    "INSERT INTO public.snapshot_answers \
  (id, testo_risposta, created_by, created_date, last_modified_by, last_modified_date, current_snapshot_question_id, answer_id)\
  VALUES(nextval('snapshot_answers_sequence'), $1, $2, $3, $2, $3, $4, $5)\
  RETURNING *",
  createSnapshotAnswerCurrentTimestamp:
    "INSERT INTO public.snapshot_answers \
(id, testo_risposta, created_by, created_date, last_modified_by, last_modified_date, current_snapshot_question_id, answer_id)\
VALUES(nextval('snapshot_answers_sequence'), $1, $2, current_timestamp, $2, current_timestamp, $3, $4)\
RETURNING *",
  createSnapshotQuestion:
    "INSERT INTO public.snapshot_questions \
  (id, testo_domanda, created_by, created_date, last_modified_by, last_modified_date, question_id) \
  VALUES(nextval('snapshot_questions_sequence'), $1, $2, $3, $2, $3, $4)\
  RETURNING *",
  createResultUser: "INSERT INTO public.results_users (id, user_name, created_by, last_modified_by)\
   VALUES(nextval('results_users_sequence'), $1, $1, $1) RETURNING *",
  findSnapAnswerId: "SELECT id FROM public.snapshot_answers WHERE created_date=(\
   SELECT MAX(created_date) from public.snapshot_answers where answer_id = $1) AND answer_id = $1",
  findSnapQuestionId: "SELECT id FROM public.snapshot_questions WHERE question_id = $1 AND created_date = $2",
  createResultUserSurvey:
    "INSERT INTO public.results_users_questions_answers\
  (id, result_user_id, snapshot_question_id, snapshot_answer_id, created_by, last_modified_by)\
  VALUES(nextval('results_users_questions_answers_sequence'), $1, $2, $3, $4, $4) RETURNING * "
};
