import {expect} from 'chai'

import Student = require('../src/student')

describe('Student', () => {
  it('can be freshly deserialized', () => {
    const data = {
      advisor: 'jborges@dtechhs.org',
      emailAddress: 'wgibson67@dtechhs.org',
      gradeLevel: 11,
      name: 'Gibson, William'
    }

    const student = new Student(data)
    expect(student).not.to.be.undefined
  })
})
