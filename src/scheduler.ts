import random = require('./lib/random')
import Student = require('./student')
import Teacher = require('./teacher')

export interface Assignments {
  [teacher: string]: {
    [subject: string]: Student[]
  }
}

export interface Need {
  subject: string,
  teacher: Teacher,
  student: Student
}

export type Bell = '@dtech' | '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th'
export type Pace = 'Ahead'  | 'Behind' | 'On'

export const bellNames: Bell[] = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th'
]

const courseConstraintsSheetTitle = 'Mikol'
const registrationSheetTitle = 'Responses for Edit'
const validStudentEmailAddress = /\d{2}@dtechhs\.org$/

const assignments: Assignments = {}
const studentsByEmailAddress: {[emailAddress: string]: Student} = {}
const teachersByEmailAddress: {[emailAddress: string]: Teacher} = {}
const validCoursesBySubject: {[subject: string]: number} = {}

export function expectAssignments(spreadsheets: any) {
  for (let i = 0, ni = spreadsheets.length; i < ni; ++i) {
    const emailAddress = `${spreadsheets[i].properties.title}@dtechhs.org`

    // XXX: Ignore a spreadsheet if it’s title doesn’t correspond to a teacher.
    if (!teachersByEmailAddress[emailAddress]) {
      continue
    }

    const subjects = teachersByEmailAddress[emailAddress].courses.map((x: any) => x.subject)
    const titles = spreadsheets[i].sheets.map((x: any) => x.properties.title as string)

    const nj = subjects.length
    let n = 0

    for (let j = 0; j < nj; ++j) {
      const expectedTitle = `Subject: ${subjects[j]}`
      if (titles.findIndex((title: string) => title === expectedTitle) > -1) {
        ++n
      }
    }

    if (n !== nj) {
      throw new Error('Missing assignments')
    }
  }
}

export function findTeacher(emailAddress: string): Teacher | undefined {
  return teachersByEmailAddress[emailAddress]
}

export function parseTeachers(registration: any) {
  const courseConstraintsSheet = registration.sheets
    .find(({properties: {title}}: any) => title === courseConstraintsSheetTitle)

  const courseConstraintColumns = courseConstraintsSheet.values[0]

  const indexOfSubject = courseConstraintColumns.indexOf('Course')
  if (indexOfSubject === -1) {
    throw new Error('Missing subject column in course constraints')
  }

  const indexOfEmailAddress = courseConstraintColumns.indexOf('Email Address')
  if (indexOfEmailAddress === -1) {
    throw new Error('Missing email address column in course constraints')
  }

  const indexOfFirstName = courseConstraintColumns.indexOf('First Name')
  if (indexOfFirstName === -1) {
    throw new Error('Missing first name column in course constraints')
  }

  const indexOfLastName = courseConstraintColumns.indexOf('Last Name')
  if (indexOfLastName === -1) {
    throw new Error('Missing last name column in course constraints')
  }

  const indexOfBells = courseConstraintColumns.indexOf('Available Bells')
  if (indexOfBells === -1) {
    throw new Error('Missing bells column in course constraints')
  }

  const indexOfMaxSections = courseConstraintColumns.indexOf('Max Sections')
  if (indexOfMaxSections === -1) {
    throw new Error('Missing max sections column in course constraints')
  }

  const indexOfMaxStudents = courseConstraintColumns.indexOf('Max Stu / Section')
  if (indexOfMaxStudents === -1) {
    throw new Error('Missing max students column in course constraints')
  }

  const indexOfExclude = courseConstraintColumns.indexOf('Exclude')
  if (indexOfExclude === -1) {
    throw new Error('Missing exclude column in course constraints')
  }

  const indexOfContentions = courseConstraintColumns.indexOf('Contentions')
  if (indexOfContentions === -1) {
    throw new Error('Missing contentions column in course constraints')
  }

  const courseConstraintRows = courseConstraintsSheet.values.slice(1)

  courseConstraintRows.forEach((row: any, index: number) => {
    if (row && row.some((x: any) => !!x && `${x}`.trim()) && !row[indexOfExclude]) {
      const emailAddress: string = row[indexOfEmailAddress]
      if (!emailAddress) {
        throw new Error(`Missing email address at course constraints row ${index + 2}`)
      }

      const firstName: string = row[indexOfFirstName]
      if (!firstName) {
        throw new Error(`Missing first name at course constraints row ${index + 2}`)
      }

      const lastName: string = row[indexOfLastName]
      if (!lastName) {
        throw new Error(`Missing last name at course constraints row ${index + 2}`)
      }

      const name = `${lastName}, ${firstName}`

      const subject: string = row[indexOfSubject]
      if (!subject) {
        throw new Error(`Missing subject at course constraints row ${index + 2}`)
      }

      const bellList = row[indexOfBells]
      if (!bellList) {
        throw new Error(`Missing bells at course constraints row ${index + 2}`)
      }

      const bells: Bell[] = bellList
        .split(/,\s*/)
        .map((x: number) => [, '1st', '2nd', '3rd', '4th', '5th', '6th'][x])
        .filter((x: any) => !!x)

      const maxSections: number = row[indexOfMaxSections] && Number(row[indexOfMaxSections])
      if (!maxSections) {
        throw new Error(`Missing max sections at course constraints row ${index + 2}`)
      }

      const maxStudents: number = row[indexOfMaxStudents] || 32

      if (!validCoursesBySubject[subject]) {
        validCoursesBySubject[subject] = bells.length + 1
      }

      const contentions = row[indexOfContentions] && row[indexOfContentions].split(/,\s*/)

      if (!teachersByEmailAddress[emailAddress]) {
        teachersByEmailAddress[emailAddress] = new Teacher({contentions, emailAddress, name})
      }

      teachersByEmailAddress[emailAddress].addCourse({bells, maxSections, maxStudents, subject})
    }
  })
}

export function parseStudents(registration: any) {
  const registrationSheet = registration.sheets
    .find((sheet: any) => sheet.properties.title === registrationSheetTitle)

  const registrationColumns = registrationSheet.values[0]

  const registrationRows = registrationSheet.values.slice(1)

  const indexOfEmailAddress = registrationColumns.indexOf('Email Address')
  if (indexOfEmailAddress === -1) {
    throw new Error('Missing email address column in registration')
  }

  const indexOfId = registrationColumns.indexOf('SSID')
  if (indexOfId === -1) {
    throw new Error('Missing student ID column in registration')
  }

  const indexOfName = registrationColumns.indexOf('Name')
  if (indexOfName === -1) {
    throw new Error('Missing name column in registration')
  }

  const indexOfAdvisor = registrationColumns.indexOf('@dtech advisor Email')
  if (indexOfAdvisor === -1) {
    throw new Error('Missing @dtech email address column in registration')
  }

  const indexOfGradeLevel = registrationColumns.indexOf('CURRENT Grade Level')
  if (indexOfGradeLevel === -1) {
    throw new Error('Missing grade level column in registration')
  }

  const indexOfEnrollmentStart = registrationColumns.indexOf('Math')
  if (indexOfEnrollmentStart === -1) {
    throw new Error('Missing first enrollment column in registration')
  }

  const indexOfEnrollmentEnd = registrationColumns.indexOf('Design Lab')
  if (indexOfEnrollmentEnd === -1) {
    throw new Error('Missing last enrollment column in registration')
  }

  // FIXME:
  const duplicatesByEmailAddress: {[k: string]: boolean} = {
    'nwilson20@dtechhs.org': true
  }

  // FIXME:
  const broken = [43]

  registrationRows.forEach((row: any, index: number) => {
    if (broken.indexOf(index + 2) === -1 && row && row.some((x: any) => !!x && `${x}`.trim())) {
      const emailAddress: string = `${row[indexOfEmailAddress]}`.toLowerCase()
      if (!emailAddress) {
        throw new Error(`Missing email address at registration row ${index + 2}`)
      }

      if (!validStudentEmailAddress.test(emailAddress)) {
        throw new Error(`Invalid email address at registration row ${index + 2}`)
      }

      const prevGradeLevel: number = row[indexOfGradeLevel]
      const gradeLevel: number = prevGradeLevel < 12 ? prevGradeLevel + 1 : prevGradeLevel
      if (!gradeLevel) {
        throw new Error(`Missing grade level at registration row ${index + 2}`)
      }

      const id: number | undefined = row[indexOfId] || undefined

      const name: string = row[indexOfName]
      if (!name) {
        throw new Error(`Missing name at registration row ${index + 2}`)
      }

      const advisor: string = `${row[indexOfAdvisor]}`.toLowerCase()
      if (!advisor) {
        throw new Error(`Missing advisor email address at registration row ${index + 2}`)
      }

      const courses: Student.Course[] = []

      for (let i = indexOfEnrollmentStart; i <= indexOfEnrollmentEnd; ++i) {
        const subject = `${row[i]}`.trim()
        if (validCoursesBySubject[subject]) {
          courses.push({subject, pace: 'On'})
        }
      }

      if (courses.length === 0) {
        throw new Error(`Student ${name} isn’t registered for any subjects`)
      }

      if (studentsByEmailAddress[emailAddress] && !duplicatesByEmailAddress[emailAddress]) {
        throw new Error(`Student ${name} duplicated at registration row ${index + 2}`)
      }

      studentsByEmailAddress[emailAddress] = new Student({
        advisor,
        courses,
        emailAddress,
        gradeLevel,
        id,
        name
      })
    }
  })
}

export function parseAssignments(spreadsheets: any) {
  spreadsheets.forEach((spreadsheet: any) => {
    const teacher = teachersByEmailAddress[`${spreadsheet.properties.title}@dtechhs.org`]

    // XXX: Ignore a spreadsheet if it’s title doesn’t correspond to a teacher.
    if (!teacher) {
      return
    }

    if (!assignments[teacher.emailAddress]) {
      assignments[teacher.emailAddress] = {}
    }

    spreadsheet.sheets.forEach((sheet: any) => {
      const title = sheet.properties.title.trim()
      const subject = title.replace(/^Subject:\s+(.*)$/, '$1')

      // XXX: We’re only looking at the divvy assignments for now.
      if (subject !== title) {
        const schedulable = validCoursesBySubject[subject]
        if (!schedulable) {
          throw new Error(`Invalid subject: ${subject}`)
        }

        if (!assignments[teacher.emailAddress][subject]) {
          assignments[teacher.emailAddress][subject] = []
        }

        const columns = sheet.values[0]

        const indexOfId = columns.indexOf('Student ID')
        if (indexOfId === -1) {
          throw new Error('Missing student ID column in assignments')
        }

        const indexOfName = columns.indexOf('Name')
        if (indexOfName === -1) {
          throw new Error('Missing name column in assignments')
        }

        const indexOfEmailAddress = columns.indexOf('Email Address')
        if (indexOfEmailAddress === -1) {
          throw new Error('Missing email address column in assignments')
        }

        const indexOfPace = columns.indexOf('Pace')
        if (indexOfPace === -1) {
          throw new Error('Missing pace column in assignments')
        }

        sheet.values.slice(1).forEach((row: any[], index: number) => {
          const emailAddress: string = row[indexOfEmailAddress]
          if (!emailAddress) {
            throw new Error(`Missing student email address for ${subject} with ${teacher} at row ${index + 2}`)
          }

          const student = studentsByEmailAddress[emailAddress]
          if (!student) {
            throw new Error(`Unknown student: ${emailAddress}`)
          }

          const pace: Pace = row[indexOfPace] && row[indexOfPace].replace(/^(Ahead|Behind|On) Pace.*$/, '$1')
          if (!pace) {
            throw new Error(`Missing pace for ${student} in ${subject} with ${teacher} at row ${index + 2}`)
          }

          student.setPaceForSubject(subject, pace)
          student.setSchedulableForSubject(subject, schedulable > 1)
          teacher.incrementDemand(subject)

          assignments[teacher.emailAddress][subject].push(student)
        })
      }
    })
  })
}

export function reset(registration: any, spreadsheets: any) {
  for (const emailAddress in teachersByEmailAddress) {
    delete teachersByEmailAddress[emailAddress]
  }

  for (const emailAddress in studentsByEmailAddress) {
    delete studentsByEmailAddress[emailAddress]
  }

  for (const emailAddress in assignments) {
    delete assignments[emailAddress]
  }

  parseTeachers(registration)
  parseStudents(registration)
  parseAssignments(spreadsheets)
}

export function divvy(): Assignments {
  const studentsBySubject = {} as any
  const teachersBySubject = {} as any

  // 1. Index students and teachers by subject.

  Object.keys(studentsByEmailAddress).forEach((emailAddress) => {
    const student = studentsByEmailAddress[emailAddress]

    student.courses.forEach((course) => {
      const subject = course.subject

      if (!studentsBySubject[subject]) {
        studentsBySubject[subject] = [student]
      } else {
        studentsBySubject[subject].push(student)
      }
    })
  })

  Object.keys(teachersByEmailAddress).forEach((emailAddress) => {
    const teacher = teachersByEmailAddress[emailAddress]

    teacher.courses.forEach((course) => {
      const subject = course.subject

      if (!teachersBySubject[subject]) {
        teachersBySubject[subject] = [teacher]
      } else {
        teachersBySubject[subject].push(teacher)
      }
    })
  })

  // 2. Loop over each known subject.

  Object.keys(validCoursesBySubject).forEach((subject) => {
    // A. Initialize one array per teacher per teacher’s section of `subject`.

    const sections: any = teachersBySubject[subject].reduce((accumulator: any, teacher: Teacher) => {
      teacher.courses.forEach((course) => {
        if (course.subject === subject) {
          for (let i = 0; i < course.maxSections; ++i) {
            accumulator.push({
              students: [],
              teacher: teacher.emailAddress
            })
          }
        }
      })

      return accumulator
    }, [])

    // B. Shuffle the list of students taking `subject`.

    const students = random.shuffle(studentsBySubject[subject])

    // C. Fill each section by assigning one student per section, starting over
    //    with the first section every n students (where n is the number of
    //    sections), until no students remain.

    const nStudents = students.length
    let xStudent = 0

    const nthSection = sections.length - 1
    let xSection = 0

    while (xStudent < nStudents) {
      sections[xSection].students.push(students[xStudent])
      xSection = (xSection === nthSection ? 0 : xSection + 1)
      ++xStudent
    }

    // D. Flatten each section into a single array per teacher, accumulating the
    //    results in `assignments` as:
    //
    //    ```
    //    {
    //      [teacher: string]: {
    //        [subject: string]: Student[]
    //      }
    //    }
    //    ```

    sections.forEach((section: any) => {
      const teacher = section.teacher

      if (!assignments[teacher]) {
        assignments[teacher] = {} as any
      }

      const subjects = assignments[teacher] as any

      if (!subjects[subject]) {
        subjects[subject] = section.students
      } else {
        subjects[subject] = subjects[subject].concat(section.students)
      }
    })
  })

  return assignments
}

export function remix() {
  const unscheduled: Need[] = []

  Object.keys(assignments).forEach((emailAddress) => {
    const teacher = teachersByEmailAddress[emailAddress]

    Object.keys(assignments[emailAddress]).forEach((subject) => {
      if (teacher.isSchedulable(subject)) {
        assignments[emailAddress][subject].forEach((student) => {
          unscheduled.push({
            subject,
            teacher,
            student
          })
        })
      }
    })
  })

  random.shuffle(unscheduled)
  unscheduled.sort((a: Need, b: Need) => {
    const {subject: aSubject, teacher: aTeacher} = a
    const {subject: bSubject, teacher: bTeacher} = b

    const aConstraintScore = aTeacher.calculateConstraintScore(aSubject)
    const bConstraintScore = bTeacher.calculateConstraintScore(bSubject)

    if (aConstraintScore > bConstraintScore) {
      return 1
    }

    if (aConstraintScore < bConstraintScore) {
      return -1
    }

    return 0
  })

  const scheduled: Need[] = []
  const unschedulable: Need[] = []

  unscheduled.forEach((need: Need) => {
    if (addStudent(need) || addSection(need)) {
      scheduled.push(need)
    } else if (swapStudent(need)) {
      scheduled.push(need)
    } else {
      unschedulable.push(need)
    }
  })

  random.shuffle(unschedulable)

  return {
    scheduled,
    unschedulable: unschedulable.filter((need: Need) => {
      if (swapStudent(need)) {
        scheduled.push(need)
        return false
      }

      return true
    })
  }
}

function addSection({subject, teacher, student}: Need) {
  if (!teacher.isMaximized(subject)) {
    const bellIndex = random.index(bellNames)

    for (let i = 0, ni = bellNames.length; i < ni; ++i) {
      const bell = bellNames[bellIndex[i]]
      const contentenders = teacher.contentions.map((x) => teachersByEmailAddress[x])
      const isUncontended = contentenders.every((x) => x.isFree(bell))

      if (isUncontended && teacher.isFree(bell, subject) && student.isFree(bell)) {
        teacher.addSection(subject, bell)
        teacher.addStudent(student, subject, bell)

        return true
      }
    }
  }

  return false
}

function addStudent({subject, teacher, student}: Need) {
  const bellIndex = random.index(bellNames)

  for (let i = 0, ni = bellNames.length; i < ni; ++i) {
    const bell = bellNames[bellIndex[i]]
    if (teacher.isSectionOpen(subject, bell) && student.isFree(bell)) {
      teacher.addStudent(student, subject, bell)
      return true
    }
  }

  return false
}

function swapStudent({subject, teacher, student}: Need) {
  for (let i = 0, ni = bellNames.length; i < ni; ++i) {
    const bell = bellNames[i]

    if (student.isFree(bell)) {
      if (teacher.isSection(subject, bell)) {
        if (teacher.swapStudent(student, subject, bell)) {
          return true
        }
      }
    }
  }

  return false
}
