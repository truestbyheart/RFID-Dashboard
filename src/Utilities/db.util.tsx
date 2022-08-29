import Database from 'tauri-plugin-sql-api';
import { invoke } from '@tauri-apps/api';
import { generateDatabaseString, readDatabaseConfigFile } from './fs.util';


const get_database_conn = async () => {
    // const invoke = window.__TAURI__.invoke;
    const config_string = await readDatabaseConfigFile();
    const db_string = generateDatabaseString(JSON.parse(config_string))
    return await Database.load(db_string)
}

export const get_db_string = async () => {
    const config_string = await readDatabaseConfigFile();
    return generateDatabaseString(JSON.parse(config_string))
}


export type DbPagination = {
    dbOptions: {
        offset: number;
    },
    meta: {
        totalPages: number;
        limit: number;
        count: number;
        page: number;
    }
}

export type UsersDataSet = {
    id: number;
    full_name: string;
    rf_id: string;
    created_at: string | null;
    updated_at: string | null;
}

export type LogsDataSet = {
    id: number;
    current_state: string;
    rf_id: string;
    created_at: string | null;
    updated_at: string | null;
}

export type UsersResult = {
    data: UsersDataSet[];
    meta: DbPagination['meta']
}

export type LogsResult = {
    data: LogsDataSet[];
    meta: DbPagination['meta']
}

export type QueryExecuteResult = {
    hasAffected: boolean;
    message: string;
}

// const invoke = window.__TAURI__.invoke;
class PaginationHandler {
    db;
    db_string: Promise<string>;
    constructor() {
        this.db = get_database_conn()
        this.db_string = invoke('get_db_string')
    }

    async get_database_conn() {
        return await Database.load(await this.db_string)
    }


    async generate_pagination_obj(table_name: string, limit: number, page: number): Promise<DbPagination> {
        // @ts-ignore
        const count: number = (await (await this.db).select(`SELECT COUNT(id) FROM ${table_name}`))[0]["COUNT(id)"] as unknown as number;
        const totalPages = Math.ceil(count / limit) || 1;
        const currentPage = page ? page : 1;
        const offset = (currentPage - 1) * limit;
        return {
            dbOptions: {
                offset
            },
            meta: {
                totalPages,
                limit,
                count,
                page: currentPage,
            }
        };
    }
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    return String(error)
}

class UsersHandler extends PaginationHandler {
    async login_user(email: string, password: string) {
        return await (await this.db).select(`SELECT * FROM auth WHERE email='${email}' AND password='${password}'`);
    }

    async check_rfid_existance(rf_id: string): Promise<object[]> {
        return await (await this.db).select(`SELECT * FROM users WHERE rf_id='${rf_id}'`);
    }

    async create_rfid_user(name: string, rf_id: string): Promise<boolean> {
        try {
            const it_exists = await this.check_rfid_existance(rf_id)
            if (it_exists.length > 0) {
                throw new Error('Card already exists')
            }
            const res = await (await this.db).execute(`INSERT INTO users (full_name,rf_id) VALUES ('${name}', '${rf_id}')`);
            return res.rowsAffected > 0 ? true : false;
        } catch (error) {
            return false;
        }
    }

    async get_all_users(limit: number, page: number): Promise<UsersResult> {
        const db_opt = await this.generate_pagination_obj("users", limit, page);
        const dataArray = await (await this.db).select(`SELECT * FROM users ORDER BY id ASC LIMIT ${limit} OFFSET ${db_opt.dbOptions.offset}`);
        return { data: dataArray as unknown as UsersDataSet[], meta: db_opt.meta };
    }

    async update_user_details(full_name: string, rf_id: string, id: number): Promise<QueryExecuteResult> {
        try {
            const it_exists = await this.check_rfid_existance(rf_id)
            if (it_exists.length > 0) {
                throw new Error('Card already exists')
            }
            await (await this.db).execute(`UPDATE users SET  full_name='${full_name}', rf_id='${rf_id}' WHERE id=${id}`);
            return { hasAffected: true, message: "User has been Updated successfully" }
        } catch (error) {
            return { hasAffected: false, message: getErrorMessage(error) }
        }

    }

    async delete_user(id: number): Promise<boolean> {
        const queryResult = await (await this.db).execute(`DELETE FROM users WHERE id='${id}'`);
        return queryResult.rowsAffected > 0 ? true : false;
    }
}

class LogsHandler extends PaginationHandler {
    async get_all_logs(limit: number, page: number): Promise<LogsDataSet[]> {
        const output = await window.__TAURI__.invoke('get_all_access_logs');
        // const db_opt = await this.generate_pagination_obj("access_logs", limit, page);
        // const dataArray = await (await this.db).select(`SELECT * FROM access_logs ORDER BY id ASC LIMIT ${limit} OFFSET ${db_opt.dbOptions.offset}`);
        // console.log(dataArray)
        return output as unknown as LogsDataSet[];
    }
}

export const usersHandler = new UsersHandler();
export const logsHandler = new LogsHandler();
