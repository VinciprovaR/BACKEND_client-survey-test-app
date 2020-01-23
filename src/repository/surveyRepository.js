module.exports = {
  getAllQuestions: "SELECT * FROM public.questions",
  getAllAnswers: "SELECT * FROM public.answers",
  getAnswerByQuestionId: "SELECT * FROM public.answers where question_id = $1",
  updateQuestion: "UPDATE public.questions SET testo = $1, last_modified_by = $2 WHERE id = $3 AND testo != $1\
  RETURNING *",
  createQuestion: "INSERT INTO public.questions\
  (id, testo, created_by, last_modified_by)\
  VALUES(nextval('questions_sequence'), $1, $2, $2)\
  RETURNING *",
  updateAnswer: "UPDATE public.answers SET testo = $1 , last_modified_by = $2 WHERE id = $3 AND testo != $1\
  RETURNING *",
  createAnswer: "INSERT INTO public.answers\
  (id, question_id, testo, created_by, last_modified_by)\
  VALUES(nextval('answers_sequence'), $1, $2, $3, $3)\
  RETURNING *",
  findLastSnapshotQuestionOfAnswer: "SELECT id FROM public.snapshot_questions WHERE current_question_id = $1 AND created_date = $2",
  createSnapshotAnswer: "INSERT INTO public.snapshot_answers \
  (id, testo, created_by, created_date, last_modified_by, last_modified_date, current_answer_id, current_question_id, current_snapshot_question_id)\
  VALUES(nextval('snapshot_answers_sequence'), $1, $2, $3, $2, $3, $4, $5, $6)\
  RETURNING *", 
  //current_answer_id risposta modificata/aggiunta, 
  //current_question_id domanda della risposta modificata/aggiunta, 
  //current_snapshot_question_id record di snapshot_question dove current_question_id = domanda della risposta modificata/aggiunta e created_date = last_modified_date 
  //della domanda della risposta modificata/aggiunta
  createSnapshotQuestion: "INSERT INTO public.snapshot_questions \
  (id, testo, created_by, created_date, last_modified_by, last_modified_date, current_question_id) \
  VALUES(nextval('snapshot_questions_sequence'), $1, $2, $3, $2, $3, $4)\
  RETURNING *"
};



