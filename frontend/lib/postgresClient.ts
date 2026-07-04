import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'realspices',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query builder - mimics PostgREST API for local PostgreSQL
class QueryBuilder {
  private table: string;
  private selectFields: string = '*';
  private filters: Array<{ field: string; value: any; operator: string }> = [];
  private orders: Array<{ field: string; ascending: boolean }> = [];
  private limitVal?: number;
  private offsetVal?: number;
  private singleRecord: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*'): this {
    this.selectFields = fields;
    return this;
  }

  // Comparison operators
  eq(field: string, value: any): this {
    this.filters.push({ field, value, operator: '=' });
    return this;
  }

  neq(field: string, value: any): this {
    this.filters.push({ field, value, operator: '!=' });
    return this;
  }

  gt(field: string, value: any): this {
    this.filters.push({ field, value, operator: '>' });
    return this;
  }

  gte(field: string, value: any): this {
    this.filters.push({ field, value, operator: '>=' });
    return this;
  }

  lt(field: string, value: any): this {
    this.filters.push({ field, value, operator: '<' });
    return this;
  }

  lte(field: string, value: any): this {
    this.filters.push({ field, value, operator: '<=' });
    return this;
  }

  in(field: string, values: any[]): this {
    this.filters.push({ field, value: values, operator: 'IN' });
    return this;
  }

  order(field: string, options?: { ascending: boolean }): this {
    this.orders.push({
      field,
      ascending: options?.ascending !== false,
    });
    return this;
  }

  limit(count: number): this {
    this.limitVal = count;
    return this;
  }

  offset(count: number): this {
    this.offsetVal = count;
    return this;
  }

  single(): this {
    this.singleRecord = true;
    return this;
  }

  async execute(): Promise<{ data: any[] | any | null; error: any | null }> {
    const client = await pool.connect();
    try {
      let sql = `SELECT ${this.selectFields} FROM "${this.table}"`;
      const params: any[] = [];
      let paramCounter = 1;

      // Build WHERE clause
      if (this.filters.length > 0) {
        const whereClauses = this.filters.map(filter => {
          if (filter.operator === 'IN') {
            const placeholders = filter.value.map(() => `$${paramCounter++}`).join(', ');
            params.push(...filter.value);
            return `"${filter.field}" IN (${placeholders})`;
          } else {
            params.push(filter.value);
            return `"${filter.field}" ${filter.operator} $${paramCounter++}`;
          }
        });
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // Build ORDER BY clause
      if (this.orders.length > 0) {
        const orderClauses = this.orders
          .map(o => `"${o.field}" ${o.ascending ? 'ASC' : 'DESC'}`)
          .join(', ');
        sql += ` ORDER BY ${orderClauses}`;
      }

      // Add LIMIT
      if (this.limitVal) {
        sql += ` LIMIT ${this.limitVal}`;
      }

      // Add OFFSET
      if (this.offsetVal) {
        sql += ` OFFSET ${this.offsetVal}`;
      }

      const result = await client.query(sql, params);
      
      // Return single record if requested
      if (this.singleRecord) {
        return { data: result.rows[0] || null, error: null };
      }

      return { data: result.rows, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      client.release();
    }
  }

  async then(callback: any): Promise<any> {
    const result = await this.execute();
    return callback(result);
  }
}

// Main database client
class PostgresClient {
  from(table: string) {
    return {
      select: (fields: string = '*') => {
        const builder = new QueryBuilder(table);
        return builder.select(fields);
      },
      insert: async (records: any[]) => {
        const client = await pool.connect();
        try {
          if (records.length === 0) {
            return { data: [], error: null };
          }

          // Collect all unique keys across all records  
          const autoIdColumns = ['id', 'admin_id'];
          const allKeys = new Set<string>();
          
          records.forEach(r => {
            Object.keys(r).forEach(k => {
              if (!autoIdColumns.includes(k) && r[k] !== null && r[k] !== undefined) {
                allKeys.add(k);
              }
            });
          });

          const keys = Array.from(allKeys);

          // If there are no keys to insert (e.g. all fields were excluded), return a clear error
          if (!keys || keys.length === 0) {
            return { data: null, error: new Error('No insertable columns found - check provided record fields') };
          }

          const placeholders = records
            .map((_, rowIdx) =>
              `(${keys.map((_, colIdx) => `$${rowIdx * keys.length + colIdx + 1}`).join(', ')})`
            )
            .join(', ');

          const quotedKeys = keys.map(k => `"${k}"`).join(', ');
          const sql = `INSERT INTO "${table}" (${quotedKeys}) VALUES ${placeholders} RETURNING *`;
          
          // Build values array - map each record to its values in the correct key order
          const values = records.flatMap(r => keys.map(k => {
            const val = r[k];
            if ((k === 'features') && (Array.isArray(val) || (typeof val === 'object' && val !== null))) {
              return JSON.stringify(val);
            }
            // Return null for missing values instead of undefined
            return val ?? null;
          }));

          // Debug logging to help trace insert issues (show keys, sql and values)
          try {
            console.log('[pg] INSERT:', { table, keys, sql, values, records });
          } catch (e) {
            // ignore logging failures
          }

          const result = await client.query(sql, values);
          return { data: result.rows, error: null };
        } catch (error: any) {
          console.error('[pg] INSERT ERROR:', { table, error: error.message });
          return { data: null, error };
        } finally {
          client.release();
        }
      },
      update: (data: any) => {
        return {
          eq: async (field: string, value: any) => {
            const client = await pool.connect();
            try {
              const keys = Object.keys(data);
              const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
              const sql = `UPDATE "${table}" SET ${setClause} WHERE "${field}" = $${keys.length + 1} RETURNING *`;
              
              // Convert arrays/objects to JSON strings for JSONB columns (like features)
              const params = [
                ...keys.map(k => {
                  const val = data[k];
                  if ((k === 'features') && (Array.isArray(val) || (typeof val === 'object' && val !== null))) {
                    return JSON.stringify(val);
                  }
                  return val;
                }),
                value
              ];

              const result = await client.query(sql, params);
              return { data: result.rows, error: null };
            } catch (error: any) {
              return { data: null, error };
            } finally {
              client.release();
            }
          },
        };
      },
      delete: () => {
        return {
          eq: async (field: string, value: any) => {
            const client = await pool.connect();
            try {
              const sql = `DELETE FROM "${table}" WHERE "${field}" = $1 RETURNING *`;
              const result = await client.query(sql, [value]);
              return { data: result.rows, error: null };
            } catch (error: any) {
              return { data: null, error };
            } finally {
              client.release();
            }
          },
        };
      },
    };
  }
}

// Raw query method
export async function rawQuery(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    console.log('[pg] Raw query:', sql, params);
    const result = await client.query(sql, params);
    return { data: result.rows, error: null };
  } catch (error: any) {
    console.error('[pg] Raw query error:', error);
    return { data: null, error };
  } finally {
    client.release();
  }
}

export const postgres = new PostgresClient();
export { pool };
