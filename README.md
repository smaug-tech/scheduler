# d.tech Scheduler

## Installation

```
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
