import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import * as lambda from "aws-lambda";
import * as pg from "pg";
import * as path from "path";
import * as fs from "fs";

interface SecretValue {
  host: string;
  username: string;
  password: string;
  dbname: string;
}

export const getSecretValue = async (secretName: string) => {
  const client = new SecretsManagerClient();
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );
  console.log(response);
  return JSON.parse(response.SecretString as string) as SecretValue;
};

exports.handler = async (
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context
): Promise<lambda.CloudFormationCustomResourceResponse> => {
  console.log("Lambda is invoked with:" + JSON.stringify(event));

  const response: lambda.CloudFormationCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName,
    Status: "SUCCESS",
  };

  try {
    if (event.RequestType === "Create") {
      console.log("INSIDE CREATE");
      const { password, username, host, dbname } = await getSecretValue(
        event.ResourceProperties.config.CredsSecretName
      );
      console.log("password: " + password);
      console.log("user: " + username);
      console.log("host: " + host);
      console.log("dbname: " + dbname);

      const client: pg.Client = new pg.Client({
        database: dbname,
        host,
        user: username,
        password,
      });

      await client.connect();
      console.log("Connected to: ", host, " database: ", dbname);

      const sqlScript = fs
        .readFileSync(path.join(__dirname, "script.sql"))
        .toString();
      const res = await client.query(sqlScript);
      await client.end();
      console.log("QUERY RESULT: ", res);
    }
    response.Data = { Result: "yarrak" };
    console.log("Returning: " + JSON.stringify(response));
    return response;
  } catch (error) {
    console.log("ERROR: " + error);
    const response: lambda.CloudFormationCustomResourceResponse = {
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      PhysicalResourceId: context.logGroupName,
      Reason: "Something went wrong",
      Status: "FAILED",
    };
    response.Data = { Result: error };
    console.log("Returning: " + JSON.stringify(response));
    return response;
  }
};
