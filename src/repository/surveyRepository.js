module.exports = {
  getAllQuestions: "SELECT * FROM public.questions",
  getAllAnswers: "SELECT * FROM public.answers",
  getAnswerByQuestionId: "SELECT * FROM public.answers where question_id = $1",
  updateQuestion: "UPDATE public.questions SET testo = $1 , last_modified_date = CURRENT_TIMESTAMP, last_modified_by = $2 WHERE id = $3\
  RETURNING *",
  createQuestion: "INSERT INTO public.questions\
  (id, testo, created_by, created_date, last_modified_by, last_modified_date)\
  VALUES(nextval('questions_sequence'), $1, $2, CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP)\
  RETURNING *",
  updateAnswer: "UPDATE public.answers SET testo = $1 , last_modified_date = CURRENT_TIMESTAMP, last_modified_by = $2 WHERE id = $3\
  RETURNING *",
  createAnswer: "INSERT INTO public.answers\
  (id, testo, created_by, created_date, last_modified_by, last_modified_date)\
  VALUES(nextval('answers_sequence'), $1, $2, CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP)\
  RETURNING *",
  createSnapshotAnswer: "INSERT INTO public.snapshot_answers \
  (id, testo, created_by, created_date, last_modified_by, last_modified_date, current_answer_id, current_question_id, current_snapshot_question_id) \
  VALUES(nextval('snapshot_answers_sequence'), $1, $2, $3, $2, $3, $4  ...)\
  RETURNING *", //current_answer_id risposta modificata/aggiunta, current_question_id domanda della risposta modificata/aggiunta, 
  //current_snapshot_question_id record di snapshot_question dove current_question_id = domanda della risposta modificata/aggiunta e created_date = last_modified_date 
  //della domanda della risposta modificata/aggiunta
  createSnapshotQuestion: "INSERT INTO public.snapshot_questions \
  (id, testo, created_by, created_date, last_modified_by, last_modified_date, current_question_id) \
  VALUES(nextval('snapshot_questions_sequence'), $1, $2, $3, $2, $3, $4)\
  RETURNING *"
};



