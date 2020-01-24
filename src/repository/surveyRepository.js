module.exports = {
  getAllQuestions: "SELECT * FROM public.questions",
  getAllAnswers: "SELECT * FROM public.answers",
  findAnswerById: "SELECT * FROM public.answers WHERE id = $1",
  getAnswerByQuestionId: "SELECT * FROM public.answers where question_id = $1",
  updateQuestion: "UPDATE public.questions SET testo = $1, last_modified_by = $2 WHERE id = $3 AND testo != $1\
  RETURNING *",
  createQuestion: "INSERT INTO public.questions\
  (id, testo, created_by, last_modified_by)\
  VALUES(nextval('questions_sequence'), $1, $2, $2)\
  RETURNING *",
  deleteQuestionById: "DELETE FROM public.questions WHERE id = $1",
  updateAnswer: "UPDATE public.answers SET testo = $1 , last_modified_by = $2 WHERE id = $3 AND testo != $1\
  RETURNING *",
  createAnswer: "INSERT INTO public.answers\
  (id, question_id, testo, created_by, last_modified_by)\
  VALUES(nextval('answers_sequence'), $1, $2, $3, $3)\
  RETURNING *",
  deleteAnswer: "DELETE FROM public.answers WHERE id = $1",
  deleteAllAnswersByQuestionId: "DELETE FROM public.answers WHERE question_id = $1",
  findLastSnapshotQuestionOfAnswer: "SELECT id FROM public.snapshot_questions WHERE created_date = $1",
  createSnapshotAnswer:
    "INSERT INTO public.snapshot_answers \
  (id, testo, created_by, created_date, last_modified_by, last_modified_date, current_snapshot_question_id, answer_id)\
  VALUES(nextval('snapshot_answers_sequence'), $1, $2, $3, $2, $3, $4, $5)\
  RETURNING *",
  createSnapshotAnswerCurrentTimestamp:
  "INSERT INTO public.snapshot_answers \
(id, testo, created_by, created_date, last_modified_by, last_modified_date, current_snapshot_question_id, answer_id)\
VALUES(nextval('snapshot_answers_sequence'), $1, $2, current_timestamp, $2, current_timestamp, $3, $4)\
RETURNING *",
  createSnapshotQuestion:
    "INSERT INTO public.snapshot_questions \
  (id, testo, created_by, created_date, last_modified_by, last_modified_date, question_id) \
  VALUES(nextval('snapshot_questions_sequence'), $1, $2, $3, $2, $3, $4)\
  RETURNING *",
  createResultUser: "",
  findSnapQuestionId
};
