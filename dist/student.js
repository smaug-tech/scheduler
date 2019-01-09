"use strict";
class Student {
    constructor({ advisor, courses, emailAddress, gradeLevel, id, name }) {
        this.advisor = advisor;
        this.courses = courses || [];
        this.emailAddress = emailAddress;
        this.gradeLevel = gradeLevel;
        this.id = id;
        this.name = name;
    }
    getPaceForSubject(subject) {
        const metadata = this.courses.find((course) => course.subject === subject);
        if (!metadata) {
            throw new Error(`Can’t find ${this} pace for ${subject}`);
        }
        return metadata.pace || 'On';
    }
    setPaceForSubject(subject, pace) {
        const metadata = this.courses.find((course) => course.subject === subject);
        if (!metadata) {
            throw new Error(`Can’t find ${this} pace for ${subject}`);
        }
        metadata.pace = pace;
    }
    // ---------------------------------------------------------------------------
    // Scheduling
    addSection(subject, bell) {
        const course = this.courses.find((x) => x.subject === subject);
        if (!course) {
            throw new Error(`Student ${this} isn’t enrolled in ${subject}`);
        }
        if (this.courses.find((x) => x.bell === bell)) {
            throw new Error(`Student ${this} is already scheduled for ${bell} bell`);
        }
        course.bell = bell;
    }
    removeSection(subject, bell) {
        const course = this.courses.find((x) => x.subject === subject);
        if (!course) {
            throw new Error(`Student ${this} isn’t enrolled in ${subject}`);
        }
        if (course.bell === bell) {
            delete course.bell;
        }
    }
    findBell(subject) {
        const course = this.courses.find((x) => x.subject === subject);
        if (!course) {
            throw new Error(`Unknown subject: ${subject}`);
        }
        return course.bell;
    }
    isFree(bell) {
        return this.courses.filter((x) => x.bell === bell).length === 0;
    }
    setSchedulableForSubject(subject, schedulable) {
        const metadata = this.courses.find((course) => course.subject === subject);
        if (!metadata) {
            throw new Error(`Can’t find ${subject} for ${this}`);
        }
        metadata.schedulable = schedulable;
    }
    // ---------------------------------------------------------------------------
    // Strings
    toString() {
        return this.emailAddress;
    }
}
module.exports = Student;
