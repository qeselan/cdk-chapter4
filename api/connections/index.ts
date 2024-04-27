import * as pg from "pg";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

let pool: pg.Pool;

interface SecretValue {
  host: string;
  username: string;
  password: string;
  dbname: string;
}

const getSecretValue = async (secretName: string) => {
  const client = new SecretsManagerClient({
    region: "us-east-1",
  });
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );
  console.log(response);
  return JSON.parse(response.SecretString as string) as SecretValue;
};

export const init = async () => {
  try {
    let secret: SecretValue;
    if (process.env.NODE_ENV !== "production") {
      secret = {
        host: "localhost",
        username: "testuser",
        dbname: "todolist",
        password: "testuser",
      };
    } else {
      secret = await getSecretValue("/rds/rds/creds/postgres-01");
    }
    console.log("Secret being used: " + JSON.stringify(secret));
    const { password, username, host, dbname } = secret;
    pool = new pg.Pool({
      database: dbname,
      host,
      user: username,
      password,
    });
  } catch (error) {
    console.log(error);
    throw new Error("failed to connect database");
  }
};

export const execute = async (query: string, params?: string[]) => {
  try {
    if (!pool)
      throw new Error(
        "Pool was not created. Ensure pool is created when running the app."
      );

    const client = await pool.connect();
    const res = await client.query(query, params);
    client.release();
    return res;
  } catch (error) {
    console.error("[postgres.connector][execute][Error]: ", error);
    throw new Error("failed query");
  }
};
