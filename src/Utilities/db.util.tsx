import Database from 'tauri-plugin-sql-api'
import { AlertProps } from '../Reusable/Alert';

const get_database_conn = async () => {
    return await Database.load("mysql://sx8kir6r3egkmzjt:jacapo1jj37mmdq8@qao3ibsa7hhgecbv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/sx7feerlqwg99h0z")
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

export type UsersResult = { 
    data: UsersDataSet[]; 
    meta: DbPagination['meta']
 }

class PaginationHandler {
    db;
    constructor() {
        this.db = get_database_conn()
    }

    async generate_pagination_obj(table_name: string, limit: number, page: number): Promise<DbPagination> {
        // @ts-ignore
        const count: number = (await (await this.db).select(`SELECT COUNT(id) FROM ${table_name}`))[0]["COUNT(id)"] as unknown as number;
        console.log(count)
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

class UsersHandler extends PaginationHandler {
    async login_user(email: string, password: string) {
        return await (await this.db).select(`SELECT * FROM auth WHERE email='${email}' AND password='${password}'`);
    }

    async check_rfid_existance(rf_id: string): Promise<object[]> {
        return await (await this.db).select("SELECT * FROM users WHERE rf_id=" + rf_id);
    }

    async create_rfid_user(name: string, rf_id: string): Promise<AlertProps> {
        try {
            const it_exists = await this.check_rfid_existance(rf_id)
            if (it_exists.length > 0) {
                throw new Error('Card already exists')
            }
            const res = await (await this.db).execute("INSERT INTO `users` (`id`, `full_name`, `rf_id`, `created_at`, `updated_at`) VALUES (NULL, '" + name + "', '" + rf_id + "', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            return { type: res.rowsAffected > 0 ? "success" : "danger", message: res.rowsAffected > 0 ? "Card  Inserted Successfully" : "Card was not added successfully" };
        } catch (error: any) {
            return { type: "danger", message: error.message };
        }
    }

    async get_all_users(limit: number, page: number): Promise<UsersResult> {
        const db_opt = await this.generate_pagination_obj("users", limit, page);
        const dataArray = await (await this.db).select(`SELECT * FROM users LIMIT ${limit} OFFSET ${db_opt.dbOptions.offset}`);
        return { data: dataArray as unknown as UsersDataSet[], meta: db_opt.meta };
    }
}

export const usersHandler = new UsersHandler();
