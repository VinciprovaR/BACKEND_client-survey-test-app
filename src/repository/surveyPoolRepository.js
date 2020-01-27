module.exports = {
  getAllQuestions: "SELECT * FROM public.questions",
  getAllAnswers: "SELECT * FROM public.answers",
  findAnswerById: "SELECT * FROM public.answers WHERE id = $1",
  getAnswerByQuestionId: "SELECT * FROM public.answers where question_id = $1",
};
