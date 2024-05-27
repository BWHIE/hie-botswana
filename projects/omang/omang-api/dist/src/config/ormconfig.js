"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.immigrationDataSourceOptions = exports.deathDataSourceOptions = exports.birthDataSourceOptions = exports.omangDataSourceOptions = void 0;
exports.omangDataSourceOptions = {
    type: 'oracle',
    username: 'omang',
    password: 'some-password',
    connectString: '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
    database: 'OMANG_CITIZEN',
};
exports.birthDataSourceOptions = {
    name: 'birthConnection',
    type: 'oracle',
    username: 'bdr',
    password: 'some-password',
    connectString: '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)(SERVICE_NAME = XE)))',
    synchronize: true,
};
exports.deathDataSourceOptions = {
    name: 'deathConnection',
    type: 'oracle',
    username: 'bdr',
    password: 'some-password',
    database: 'V_DEATH',
    connectString: '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
    synchronize: true,
};
exports.immigrationDataSourceOptions = {
    name: 'immigrationConnection',
    type: 'oracle',
    username: 'immigration',
    password: 'some-password',
    database: 'V_MOH',
    connectString: '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA = (SID = XE)))',
    synchronize: true,
};
//# sourceMappingURL=ormconfig.js.map