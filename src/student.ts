import * as scheduler from './scheduler'

declare namespace Student {
  export interface Course {
    bell?: scheduler.Bell,
    pace?: scheduler.Pace,
    schedulable?: boolean,
    subject: string
  }

  export interface Serialized {
    advisor: string,
    courses?: Course[],
    emailAddress: string,
    gradeLevel: number,
    id?: number,
    name: string
  }
}

class Student {
  constructor({
    advisor,
    courses,
    emailAddress,
    gradeLevel,
    id,
    name
  }: Student.Serialized) {
    this.advisor = advisor
    this.courses = courses || []
    this.emailAddress = emailAddress
    this.gradeLevel = gradeLevel
    this.id = id
    this.name = name
  }

  // ---------------------------------------------------------------------------
  // Properties

  public readonly advisor: string

  public readonly courses: Student.Course[]

  public readonly emailAddress: string

  public readonly gradeLevel: number

  public readonly id?: number

  public readonly name: string

  public getPaceForSubject(subject: string): string {
    const metadata = this.courses.find((course) => course.subject === subject)

    if (!metadata) {
      throw new Error(`Can’t find ${this} pace for ${subject}`)
    }

    return metadata.pace || 'On'
  }

  public setPaceForSubject(subject: string, pace: string) {
    const metadata = this.courses.find((course) => course.subject === subject)

    if (!metadata) {
      throw new Error(`Can’t find ${this} pace for ${subject}`)
    }

    metadata.pace = pace as scheduler.Pace
  }

  // ---------------------------------------------------------------------------
  // Scheduling

  public addSection(subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Student ${this} isn’t enrolled in ${subject}`)
    }

    if (this.courses.find((x) => x.bell === bell)) {
      throw new Error(`Student ${this} is already scheduled for ${bell} bell`)
    }

    course.bell = bell
  }

  public removeSection(subject: string, bell: scheduler.Bell) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Student ${this} isn’t enrolled in ${subject}`)
    }

    if (course.bell === bell) {
      delete course.bell
    }
  }

  public findBell(subject: string) {
    const course = this.courses.find((x) => x.subject === subject)

    if (!course) {
      throw new Error(`Unknown subject: ${subject}`)
    }

    return course.bell
  }

  public isFree(bell: scheduler.Bell) {
    return this.courses.filter((x) => x.bell === bell).length === 0
  }

  public setSchedulableForSubject(subject: string, schedulable: boolean) {
    const metadata = this.courses.find((course) => course.subject === subject)

    if (!metadata) {
      throw new Error(`Can’t find ${subject} for ${this}`)
    }

    metadata.schedulable = schedulable
  }

  // ---------------------------------------------------------------------------
  // Strings

  public toString() {
    return this.emailAddress
  }
}

// tslint:disable-next-line:prefer-object-spread
export = Student
