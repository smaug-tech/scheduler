"use strict";
require("../promise");
const fs = require("fs");
const out = require("../lib/out");
// @ts-ignore: TS7016: Could not find a declaration file for module 'run-simple/lib/argv-parser'.
const ArgvParser = require("run-simple/lib/argv-parser");
const SpreadsheetRevisionQueue = require("../lib/spreadsheet-revision-queue");
const scheduler = require("../scheduler");
function computeKeyFromEmailAddress(emailAddress) {
    return emailAddress.replace(/^([^@]+?)@dtechhs\.org$/, '$1');
}
module.exports = function run(options = { argv: process.argv.slice(2) }) {
    const { remote = `${__dirname}/../../remote` } = options;
    const remoteAssignments = `${remote}/assignments`;
    const { updates = `${__dirname}/../../updates` } = options;
    function fail(message, code = 1) {
        (console.error)(message);
        process.exit(code);
    }
    function usage(code, message) {
        const log = console[code ? 'error' : 'log'];
        if (message) {
            log(message);
        }
        log('Usage: schedule -- [-h | --help] <command>');
        process.exit(code);
    }
    const argv = new ArgvParser(options.argv, {
        aliases: {
            help: 'h'
        },
        defaults: {
            help: false
        },
        validate: function validate(key, value) {
            if (!this.aliases[key]) {
                usage(1, 'Unknown option: ' + key);
            }
            return true;
        }
    }).parse();
    if (argv.help) {
        usage();
    }
    const commandsByName = {
        '': merge,
        divvy,
        merge,
        remix
    };
    const name = argv[''].join(' ');
    const command = commandsByName[name];
    if (!command) {
        usage(1, `Unknown command: ${name}`);
    }
    const registration = require(`${remote}/registration.json`);
    const assignments = fs.readdirSync(remoteAssignments)
        .map((x) => {
        const m = require(`${remoteAssignments}/${x}`);
        return m;
    });
    command();
    function divvy() {
        scheduler.parseTeachers(registration);
        scheduler.parseStudents(registration);
        const result = scheduler.divvy();
        const emailAddresses = Object.keys(result);
        emailAddresses.forEach((emailAddress) => {
            const teacher = result[emailAddress];
            const subjects = Object.keys(teacher);
            // console.log(teacher)
            // console.log(subjects)
            const key = computeKeyFromEmailAddress(emailAddress);
            const input = assignments.find((x) => x.properties.title === key);
            const queue = new SpreadsheetRevisionQueue(input);
            // Divvying is a scorched-earth operation. Delete all existing subjects
            // and any empty sheets.
            input.sheets.forEach((sheet) => {
                const isEmpty = sheet.values.length === 0;
                const isSubject = /^Subject: /.test(sheet.properties.title.trim());
                const isBell = /^(@dtech|1st|2nd|3rd|4th|5th|6th): /.test(sheet.properties.title.trim());
                if (isEmpty || isSubject || isBell) {
                    queue.remove(sheet.properties.sheetId);
                }
            });
            subjects.forEach((subject, index) => {
                const sheetId = queue.add(`Temporary: ${subject} ${index}-${Date.now()}`, index);
                const students = teacher[subject];
                const rows = students.map((student) => {
                    const course = student.courses.find((x) => x.subject === subject);
                    const pace = course && course.pace || 'On';
                    return [
                        student.id,
                        student.name,
                        student.emailAddress,
                        SpreadsheetRevisionQueue.validPaceByName[pace]
                    ];
                });
                rows.unshift(['Student ID', 'Name', 'Email Address', 'Pace']);
                const dataRange = {
                    endColumnIndex: 4,
                    endRowIndex: rows.length,
                    sheetId,
                    startColumnIndex: 0,
                    startRowIndex: 0
                };
                queue.set(dataRange, SpreadsheetRevisionQueue.glossRowData(rows));
                const validation = students.map(() => [SpreadsheetRevisionQueue.paceDataValidation]);
                const validationRange = {
                    endColumnIndex: 4,
                    endRowIndex: rows.length,
                    sheetId,
                    startColumnIndex: 3,
                    startRowIndex: 1
                };
                queue.set(validationRange, SpreadsheetRevisionQueue.glossRowValidation(validation, (x) => x));
                queue.rename(sheetId, `Subject: ${subject}`);
            });
            fs.writeFileSync(`${updates}/${key}.json`, JSON.stringify(queue, null, 2));
        });
    }
    function merge() {
        fail('merge: Not implemented');
        scheduler.parseTeachers(registration);
        try {
            scheduler.expectAssignments(assignments);
        }
        catch (_) {
            fail('Some courses haven’t been assigned students (try `run schedule -- divvy`)');
        }
    }
    function remix() {
        scheduler.parseTeachers(registration);
        try {
            scheduler.expectAssignments(assignments);
        }
        catch (_) {
            fail('Some courses haven’t been assigned students (try `run schedule -- divvy`)');
        }
        scheduler.parseStudents(registration);
        scheduler.parseAssignments(assignments);
        let result = scheduler.remix();
        const total = result.scheduled.length + result.unschedulable.length;
        const target = 30; // Number of students "ok" to be unscheduled (PARAMETER)
        let min = result.unschedulable.length;
        out.writeln(`min: ${min} / ${total} = ${(min / total).toFixed(6)} -- 1`);
        for (let i = 0; i < 10000 && min > target; ++i) { // Sets # of times to run schedule alg (PARAMETER)
            scheduler.reset(registration, assignments);
            const alternateResult = scheduler.remix();
            if (alternateResult.unschedulable.length < min) {
                result = alternateResult;
                min = alternateResult.unschedulable.length;
            }
            const n = i + 1;
            if (n % 25 === 0) {
                out.writeln(`min: ${min} / ${total} = ${(min / total).toFixed(6)} -- ${n}`);
            }
        }
        out.writeln(`min: ${min} / ${total} = ${(min / total).toFixed(6)} -- Final`);
        writeScheduleUpdates(result.scheduled);
        writeMasterScheduleUpdates(result);
    }
    function writeMasterScheduleUpdates(result) {
        const schedule = result.scheduled.concat(result.unschedulable);
        const spreadsheetId = '1DFdFUysFwqobP0Oia-zIlvg9txwLBwk241yLLXVbt7I';
        const scheduleByStudent = {};
        const studentsByEmailAddress = {};
        schedule.forEach(({ student, subject, teacher }) => {
            if (!scheduleByStudent[`${student}`]) {
                const advisor = scheduler.findTeacher(student.advisor);
                studentsByEmailAddress[`${student}`] = student;
                scheduleByStudent[`${student}`] =
                    [`${advisor ? advisor.abbreviatedName : student.advisor}`];
            }
            const bell = student.findBell(subject);
            if (bell) {
                const index = scheduler.bellNames.indexOf(bell);
                if (index === -1) {
                    throw new Error(`Unknown bell: ${bell}`);
                }
                scheduleByStudent[`${student}`][index + 1] =
                    `${subject} (${teacher.abbreviatedName})`;
            }
        });
        const rows = [
            ['Student ID', 'Name', 'Email Address', '@dtech', '1st', '2nd', '3rd', '4th', '5th', '6th']
        ];
        Object.keys(scheduleByStudent).forEach((emailAddress) => {
            const sections = scheduleByStudent[emailAddress];
            const student = studentsByEmailAddress[emailAddress];
            for (let i = 0, ni = scheduler.bellNames.length; i < ni; ++i) {
                if (!sections[i + 1]) {
                    sections[i + 1] = `FIT-${student.gradeLevel}`;
                }
            }
            rows.push([Number(student.id), student.name, emailAddress].concat(sections));
        });
        const input = assignments.find((x) => x.spreadsheetId === spreadsheetId);
        const queue = new SpreadsheetRevisionQueue(input);
        // Updating schedules is a scorched-earth operation. Delete any existing
        // master schedule and any empty sheets.
        input.sheets.forEach((sheet) => {
            const isEmpty = sheet.values.length === 0;
            const isMaster = /^Master Schedule$/.test(sheet.properties.title.trim());
            const isUnscheduled = /^Unscheduled$/.test(sheet.properties.title.trim());
            if (isEmpty || isMaster || isUnscheduled) {
                queue.remove(sheet.properties.sheetId);
            }
        });
        const sheetId = queue.add(`Temporary: Master Schedule ${Date.now()}`, 0);
        const dataRange = {
            endColumnIndex: rows[0].length,
            endRowIndex: rows.length,
            sheetId,
            startColumnIndex: 0,
            startRowIndex: 0
        };
        queue.set(dataRange, SpreadsheetRevisionQueue.glossRowData(rows));
        queue.rename(sheetId, 'Master Schedule');
        const unscheduledRows = [['Student ID', 'Name', 'Email Address']];
        let maxUnscheduled = 0;
        const unschedulable = {};
        result.unschedulable
            .sort((a, b) => a.student.emailAddress.localeCompare(b.student.emailAddress))
            .forEach(({ subject, teacher, student }) => {
            if (!unschedulable[`${student}`]) {
                unschedulable[`${student}`] = {
                    student,
                    conflicts: []
                };
            }
            unschedulable[`${student}`].conflicts.push(`${subject} (${teacher.abbreviatedName})`);
            maxUnscheduled = Math.max(maxUnscheduled, unschedulable[`${student}`].conflicts.length);
        });
        Object.keys(unschedulable).forEach((emailAddress) => {
            const { student, conflicts } = unschedulable[emailAddress];
            unscheduledRows.push([student.id, student.name, student.emailAddress].concat(conflicts));
        });
        const unscheduledSheetId = queue.add(`Temporary: Unscheduled ${Date.now()}`, 1);
        const unscheduledDataRange = {
            endColumnIndex: unscheduledRows[0].length + maxUnscheduled,
            endRowIndex: unscheduledRows.length,
            sheetId: unscheduledSheetId,
            startColumnIndex: 0,
            startRowIndex: 0
        };
        queue.set(unscheduledDataRange, SpreadsheetRevisionQueue.glossRowData(unscheduledRows));
        queue.rename(unscheduledSheetId, 'Unscheduled');
        fs.writeFileSync(`${updates}/00-master-schedule.json`, JSON.stringify(queue, null, 2));
    }
    function writeScheduleUpdates(scheduled) {
        const schedule = {};
        scheduled.forEach(({ subject, teacher, student }) => {
            const key = computeKeyFromEmailAddress(teacher.emailAddress);
            const title = `${student.findBell(subject)}: ${subject}`;
            if (!schedule[key]) {
                schedule[key] = {};
            }
            if (!schedule[key][title]) {
                schedule[key][title] = [];
            }
            schedule[key][title].push(student);
        });
        Object.keys(schedule).forEach((key) => {
            const teacher = schedule[key];
            const titles = Object.keys(teacher).sort();
            const input = assignments.find((x) => x.properties.title === key);
            const queue = new SpreadsheetRevisionQueue(input);
            let sheetIndex = 0;
            // Updating schedules is a scorched-earth operation. Delete all existing
            // bell sheets and any empty sheets.
            input.sheets.forEach((sheet) => {
                const isEmpty = sheet.values.length === 0;
                const isBell = /^(@dtech|1st|2nd|3rd|4th|5th|6th): /.test(sheet.properties.title.trim());
                const isSubject = /^Subject: /.test(sheet.properties.title.trim());
                if (isEmpty || isBell) {
                    queue.remove(sheet.properties.sheetId);
                }
                if (isSubject) {
                    ++sheetIndex;
                }
            });
            titles.forEach((title, index) => {
                const sheetId = queue.add(`Temporary: ${title} ${index}-${Date.now()}`, sheetIndex++);
                const students = teacher[title];
                const rows = students.map((student) => {
                    const course = student.courses.find((x) => `${x.bell}: ${x.subject}` === title);
                    const pace = course && course.pace || 'On';
                    return [
                        student.id,
                        student.name,
                        student.emailAddress,
                        SpreadsheetRevisionQueue.validPaceByName[pace]
                    ];
                });
                rows.unshift(['Student ID', 'Name', 'Email Address', 'Pace']);
                const dataRange = {
                    endColumnIndex: 4,
                    endRowIndex: rows.length,
                    sheetId,
                    startColumnIndex: 0,
                    startRowIndex: 0
                };
                queue.set(dataRange, SpreadsheetRevisionQueue.glossRowData(rows));
                queue.rename(sheetId, title);
            });
            fs.writeFileSync(`${updates}/${key}.json`, JSON.stringify(queue, null, 2));
        });
    }
};
