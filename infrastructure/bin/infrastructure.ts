#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib";

const app = new cdk.App();
new InfrastructureStack(app, "InfrastructureStack", {
  env: { region: "us-east-1", account: process.env.CDK_DEFAULT_ACCOUNT },
});
