# d.tech Scheduler

## Installation

```
install node
npm install -g run-simple
npm install
run dist
```

## Usage

### Initializing

**Warning:**  _This will remove all existing schedules._ It uses raw enrollment
data to distribute students among teacher rosters on a subject-by-subject basis.
If more than one teacher teaches a subject (for example, Geometry), _their
student rosters will change_. If any student is in the [master schedule
spreadsheet][master] but not in the [enrollment spreadsheet][enrollment], they
will be dropped from all rosters.

**Don't run this if you aready have the classes distributed. All this does is take all students taking a course and distribute them amongst the teachers who are teching that subject.**

*Has been throwing an error. I've had to run this twice. After the second time it creates a "untitled.json" (or something similar) and I have to delete it or I get an error when running remix.*

```
run divvy
```

### Running

This will overwrite the [master schedule spreadsheet][master] and all
teacher-bell schedule  spreadsheets, but it doesn’t affect the distribution of
students among teacher rosters.

```
run remix
```

### Sustaining

**Not yet implemented.** (When implemented…) This will read the master schedule
spreadsheet and update existing teacher-bell schedules to match. Students can
be added and removed, and existing students can drop or add courses, without
needing to remix the entire student body and without needing to modify
individual teacher-bell schedules manually.

```
run merge
```

[enrollment]: https://docs.google.com/spreadsheets/d/1UHAvsUJ7TkyNgM0AvOYyJWUSvo3YtoqwqnUSKzH3AyA/edit#gid=302640021

[master]: https://docs.google.com/spreadsheets/d/1PzN9Zsh7QJzhOu3wz73_D-7eBIACCvhq1eexBeUPLW8


## Initial Setup
### Google Drive Set Up
Initialize
- Folder in drive for rosters and Master Schedule
    - needs to be created beforehand
    - scripts/initialize-assignments.js
    - const folderId = *insert id for folder here*
- Master Spreadsheet
    - needs to be created beforehand
    - scripts/get-assignments.js   
        - id: *insert id for spreadsheet here*
    - src/cli/schedule.ts
        - const spreadsheetID = *insert id for spreadsheet here*
- Registration Assignments
    - Needs to be created beforehand
        - Responses for edit --> where you find the student enrollments
        - Mikol --> Constraints
        - Keep the headers the sameish
    - scripts/get-registration.js
        const spreadsheetId = *insert id for spreadsheet here*



