import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ACM } from "./constructs/ACM";
import { Route53 } from "./constructs/Route53";
import { Port, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Frontend } from "./constructs/Frontend";
import { Backend } from "./constructs/Backend";
import { RDS } from "./constructs/RDS";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";


export class InfrastructureStack extends cdk.Stack {
  public readonly acm: ACM;
  public readonly route53: Route53;
  public readonly vpc: Vpc;
  public readonly rds: RDS;
  public readonly frontend: Frontend;
  public readonly backend: Backend;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.route53 = new Route53(this, "Route53");

    this.acm = new ACM(this, "ACM", {
      hosted_zone: this.route53.hosted_zone,
    });

    this.vpc = new Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { cidrMask: 24, name: "public", subnetType: SubnetType.PUBLIC },
        {
          cidrMask: 24,
          name: "private_nat",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "private_isolated",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.frontend = new Frontend(this, "Frontend", {
      acm: this.acm,
      route53: this.route53,
    });

    this.rds = new RDS(this, "RDS", {
      vpc: this.vpc,
    });

    this.backend = new Backend(this, "Backend", {
      vpc: this.vpc,
      rds: this.rds,
      acm: this.acm,
      route53: this.route53,
    });

    this.rds.database.connections.allowFrom(
      this.backend.cluster,
      Port.tcp(5432)
    );

    this.backend.task_definition.taskRole.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [this.rds.dbSecret.secretArn],
      })
    );

    this.backend.node.addDependency(this.rds);
  }
}
