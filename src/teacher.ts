import random = require('./lib/random')
import * as scheduler from './scheduler'
import Student = require('./student')

const maxSectionsPerTeacher = 5

declare namespace Teacher {
  export interface Section {
    bell: scheduler.Bell,
    students: Student[],
    subject: string
  }

  export interface PartialCourse {
    bells: scheduler.Bell[],
    demand?: number,
    maxSections: number,
    maxStudents: number,
    subject: string
  }

  export interface Course {
    bells: scheduler.Bell[],
    demand: number,
    maxSections: number,
    maxStudents: number,
    subject: string
  }

  export interface Searialized {
    contentions?: string[],
    courses?: Course[],
    sections?: Section[],
    emailAddress: string,
    name: string
  }
}

function calculateMaxStudents(course: Teacher.Course) {
  return Math.max(Math.floor(course.demand / course.maxSections) + 1, course.maxStudents)
}

class Teacher {
  constructor({contentions, courses, emailAddress, name, sections}: Teacher.Searialized) {
    this.contentions = contentions || []
    this.courses = courses || []
    this.emailAddress = emailAddress
    this.name = name
    this.sections = sections || []
  }

  // ---------------------------------------------------------------------------
  // Properties

  public get abbreviatedName() {
    return this.name.replace(/^([^,]+, \w).*/, '$1.')
  }

  public readonly contentions: string[]

  public readonly courses: Teacher.Course[]

  public readonly emailAddress: string

  public readonly name: string

  public readonly sections: Teacher.Section[]

  // ---------------------------------------------------------------------------
  // Scheduling

  public addCourse({bells, demand = 0, maxSections, maxStudents, subject}: Teacher.PartialCourse) {
    this.courses.push({bells, demand, maxSections, maxStudents, subject})
  }

  public incrementDemand(subject: string) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    course.demand++
  }

  public addSection(subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    const sections = this.sections.filter((section) => section.subject === subject)

    if (sections.length === course.maxSections) {
      throw new Error(`Can’t exceed maximum sections (${course.maxSections}) for ${subject} with ${this}`)
    }

    if (this.sections.length === maxSectionsPerTeacher) {
      throw new Error(`Can’t exceed maximum sections (${course.maxSections}) for ${this}`)
    }

    if (!course.bells.find((b) => b === bell)) {
      throw new Error(`Can’t schedule ${this} at ${bell} bell`)
    }

    if (sections.find((x) => x.bell === bell)) {
      throw new Error(`Can’t schedule ${this} at ${bell} bell`)
    }

    this.sections.push({
      bell,
      students: [],
      subject
    } as Teacher.Section)
  }

  public addStudent(student: Student, subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    const section = this.sections.find((x) => x.bell === bell && x.subject === subject)

    if (!section) {
      throw new Error(`Can’t schedule ${student} for nonexistent section of ${subject} at ${bell} bell`)
    }

    const maxStudents = calculateMaxStudents(course)

    if (section.students.length === maxStudents) {
      // tslint:disable-next-line:max-line-length
      throw new Error(`Can’t exceed maximum students (${maxStudents}) for ${subject} with ${this} at ${bell} bell`)
    }

    student.addSection(subject, bell)
    section.students.push(student)
  }

  public removeStudent(student: Student, subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    const section = this.sections.find((x) => x.bell === bell && x.subject === subject)

    if (!section) {
      throw new Error(`Can’t remove ${student} from nonexistent section of ${subject} at ${bell} bell`)
    }

    const index = section.students.findIndex((x) => x.emailAddress === student.emailAddress)

    if (index > -1) {
      student.removeSection(subject, bell)
      section.students.splice(index, 1)
    }
  }

  public rescheduleStudent(student: Student, section: Teacher.Section) {
    const bellIndex = random.index(scheduler.bellNames)

    for (let i = 0, ni = bellIndex.length; i < ni; ++i) {
      const bell = scheduler.bellNames[bellIndex[i]]

      if (bell === section.bell) {
        continue
      }

      if (this.isSection(section.subject, bell)) {
        try {
          this.addStudent(student, section.subject, bell)
          this.removeStudent(student, section.subject, section.bell)
          return true
        } catch (_) {
          continue
        }
      }
    }

    return false
  }

  public swapStudent(student: Student, subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    const section = this.sections.find((x) => x.bell === bell && x.subject === subject)

    if (!section) {
      throw new Error(`Can’t swap ${student} from nonexistent section of ${subject} at ${bell} bell`)
    }

    const students = section.students
    const studentIndex = random.index(students)

    for (let i = students.length; i-- > 0;) {
      const peer = students[studentIndex[i]]
      if (this.rescheduleStudent(peer, section)) {
        this.addStudent(student, subject, bell)
        return true
      }
    }

    return false
  }

  public calculateConstraintScore(subject: string) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    return course.bells.length * course.maxSections
  }

  public isFree(bell: scheduler.Bell, subject?: string) {
    let isSchedulable = true

    if (subject) {
      const course = this.courses.find((x) => x.subject === subject)

      if (!course) {
        throw new Error(`Unknown subject: ${subject}`)
      }

      isSchedulable = course.bells.some((b) => b === bell)
    }

    if (isSchedulable) {
      const isScheduled = this.sections.some((x) => x.bell === bell)

      if (!isScheduled) {
        return true
      }
    }

    return false
  }

  public isSchedulable(subject: string) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    return course.bells.length > 0
  }

  public isSection(subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    const section = this.sections.find((x) => x.bell === bell)

    if (section && section.subject === subject) {
      return true
    }

    return false
  }

  public isSectionOpen(subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    const section = this.sections.find((x) => x.bell === bell)
    const maxStudents = calculateMaxStudents(course)

    if (section && section.subject === subject && section.students.length < maxStudents) {
      return true
    }

    return false
  }

  public isMaximized(subject: string) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    return this.sections.filter((x) => x.subject === subject).length === course.maxSections
  }

  // ---------------------------------------------------------------------------
  // Strings

  public toString() {
    return this.emailAddress
  }
}

export = Teacher
