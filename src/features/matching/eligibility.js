export function eligibleTeachers(teachers, { mode, wanted, offered }) {
  return teachers.filter(teacher => teacher.skill === wanted && (
    mode === 'sos' ? teacher.volunteer === true : teacher.wants.includes(offered)
  ))
}
