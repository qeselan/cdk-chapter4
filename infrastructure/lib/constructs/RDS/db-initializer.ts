import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cr from "aws-cdk-lib/custom-resources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as iam from "aws-cdk-lib/aws-iam";

import { CustomResource, Duration, Stack, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface CdkResourceInitializerProps {
  vpc: ec2.Vpc;
  securityGroups: ec2.SecurityGroup[];
  fnTimeout: Duration;
  fnCode: lambda.DockerImageCode;
  fnLogRetention: logs.RetentionDays;
  memorySize?: number;
  config: any;
}

export class CdkResourceInitializer extends Construct {
  readonly customResource: CustomResource;
  readonly response: string;
  readonly dbInitializerFn: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: CdkResourceInitializerProps
  ) {
    super(scope, id);

    this.dbInitializerFn = this.createDbLambdaFunction(props, id);
    this.customResource = this.createProviderCustomResource(props, id);
  }

  private createDbLambdaFunction(
    props: CdkResourceInitializerProps,
    id: string
  ): lambda.Function {
    return new lambda.DockerImageFunction(this, "dbInitializerFunction", {
      memorySize: props.memorySize || 128,
      functionName: `${id}-lambdaFunction`,
      code: props.fnCode,
      vpc: props.vpc,
      securityGroups: props.securityGroups,
      timeout: props.fnTimeout,
      logRetention: props.fnLogRetention,
    });
  }

  private createProviderCustomResource(
    props: CdkResourceInitializerProps,
    id: string
  ): CustomResource {
    const customResourceFnRole = new iam.Role(this, "AwsCustomResourceRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    const region = Stack.of(this).region;
    const account = Stack.of(this).account;
    customResourceFnRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [
          `arn:aws:lambda:${region}:${account}:function:${this.dbInitializerFn.functionName}`,
        ],
      })
    );
    const provider = new cr.Provider(this, "Provider", {
      onEventHandler: this.dbInitializerFn,
      logRetention: props.fnLogRetention,
      vpc: props.vpc,
      securityGroups: props.securityGroups,
    });
    return new CustomResource(this, "CustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        config: props.config,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      resourceType: "Custom::DBCustomResource",
    });
  }
}
