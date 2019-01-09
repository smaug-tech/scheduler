"use strict";
// FIXME: Use googleapis type information.
// import {sheets_v4} from 'googleapis'
const random = require("./random");
const headerTextFormatCellData = {
    userEnteredFormat: {
        textFormat: {
            bold: true
        }
    }
};
const headerTextFormatRowData = [
    {
        values: new Array(26).fill(headerTextFormatCellData)
    }
];
const gridProperties = {
    frozenColumnCount: 3,
    frozenRowCount: 1
};
const supportedFields = [
    'dataValidation',
    'hyperlink',
    'note',
    'userEnteredFormat',
    'userEnteredValue'
];
function parseFields(rows) {
    const fields = {};
    rows.forEach(({ values }) => {
        values.forEach((value) => {
            Object.keys(value).forEach((field) => {
                if (supportedFields.indexOf(field) > -1) {
                    fields[field] = true;
                }
                else {
                    throw new Error(`Unsupported field: ${field}`);
                }
            });
        });
    });
    return Object.keys(fields).join(',');
}
class SpreadsheetRevisionQueue {
    static get paceDataValidation() {
        return {
            dataValidation: {
                condition: {
                    type: 'ONE_OF_LIST',
                    values: [
                        { userEnteredValue: 'Behind Pace (-1)' },
                        { userEnteredValue: 'On Pace (0)' },
                        { userEnteredValue: 'Ahead (+1)' }
                    ]
                },
                showCustomUi: true,
                strict: true
            }
        };
    }
    static get validPaceByName() {
        return {
            Ahead: 'Ahead (+1)',
            Behind: 'Behind Pace (-1)',
            On: 'On Pace (0)'
        };
    }
    static glossExtendedValue(value) {
        switch (typeof value) {
            case 'boolean':
                return { boolValue: value };
            case 'number':
                return { numberValue: value };
            case 'object':
                // XXX: Throw away garbage input.
                return { stringValue: '' };
        }
        return { stringValue: (value || '') };
    }
    static glossCellData(value, gloss = SpreadsheetRevisionQueue.glossExtendedValue) {
        return {
            userEnteredValue: gloss(value)
        };
    }
    static glossRowData(rows, gloss = SpreadsheetRevisionQueue.glossCellData) {
        // tslint:disable-next-line:no-unnecessary-callback-wrapper
        return rows.map((row) => ({ values: row.map((cell) => gloss(cell)) }));
    }
    static glossCellValidation(value, gloss = (x) => x) {
        return {
            dataValidation: gloss(value)
        };
    }
    static glossRowValidation(rows, gloss = SpreadsheetRevisionQueue.glossCellValidation) {
        // tslint:disable-next-line:no-unnecessary-callback-wrapper
        return rows.map((row) => ({ values: row.map((cell) => gloss(cell)) }));
    }
    constructor(spreadsheet) {
        this._spreadsheetId = spreadsheet.spreadsheetId;
        this._sheetIds = spreadsheet.sheets.reduce((accumulator, sheet) => {
            accumulator[sheet.properties.sheetId] = 1;
            return accumulator;
        }, {});
        this._add = [];
        this._remove = [];
        this._set = [];
        this._updatingSheetIds = {};
    }
    get spreadsheetId() {
        return this._spreadsheetId;
    }
    get requests() {
        const requests = this._add.concat(this._remove).concat(this._set);
        Object.keys(this._updatingSheetIds).forEach((sheetId) => {
            requests.push({
                autoResizeDimensions: {
                    dimensions: {
                        dimension: 'COLUMNS',
                        sheetId: Number(sheetId)
                    }
                }
            });
        });
        return requests;
    }
    add(title, index) {
        const sheetId = this.makeRandomSheetId();
        this._add.push({
            addSheet: {
                properties: {
                    gridProperties,
                    index,
                    sheetId,
                    title
                }
            }
        });
        const range = {
            endColumnIndex: headerTextFormatRowData.reduce((n, r) => Math.max(n, r.values.length), 0),
            endRowIndex: headerTextFormatRowData.length,
            sheetId,
            startColumnIndex: 0,
            startRowIndex: 0
        };
        this.set(range, headerTextFormatRowData);
        this._updatingSheetIds[sheetId] = 1;
        this._sheetIds[sheetId] = 1;
        return sheetId;
    }
    remove(sheetId) {
        this._remove.push({
            deleteSheet: {
                sheetId
            }
        });
        delete this._updatingSheetIds[sheetId];
        return sheetId;
    }
    rename(sheetId, title) {
        this._set.push({
            updateSheetProperties: {
                fields: 'sheetId,title',
                properties: {
                    sheetId,
                    title
                }
            }
        });
    }
    set(range, rows) {
        this._set.push({
            updateCells: {
                fields: parseFields(rows),
                range,
                rows
            }
        });
        this._updatingSheetIds[range.sheetId] = 1;
        this._sheetIds[range.sheetId] = 1;
        return range.sheetId;
    }
    toJSON() {
        return {
            requestBody: {
                requests: this.requests
            },
            spreadsheetId: this.spreadsheetId
        };
    }
    makeRandomSheetId() {
        let sheetId = random.int(0, 2147483647);
        while (this._sheetIds[sheetId]) {
            sheetId = random.int(0, 2147483647);
        }
        this._sheetIds[sheetId] = 1;
        return sheetId;
    }
}
module.exports = SpreadsheetRevisionQueue;
