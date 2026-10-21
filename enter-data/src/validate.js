const STUDENT_ID = /^A0\d{7}$/;
const COURSE_CODE = /^[A-Z]{4}\d{4}$/;

function validateGrade(input) {
  const errors = [];
  const studentId = String(input.student_id || '').trim().toUpperCase();
  const courseCode = String(input.course_code || '').trim().toUpperCase();
  const scoreText = String(input.score ?? '').trim();
  const score = Number(scoreText);

  if (!STUDENT_ID.test(studentId)) errors.push('Student ID must look like A01234567');
  if (!COURSE_CODE.test(courseCode)) errors.push('Course code must look like ACIT3495');
  if (scoreText === '' || !Number.isFinite(score) || score < 0 || score > 100) {
    errors.push('Score must be a number from 0 to 100');
  }
  return { errors, value: { studentId, courseCode, score: Math.round(score * 100) / 100 } };
}

module.exports = { validateGrade };
