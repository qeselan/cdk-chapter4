import { Duration } from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { CdkResourceInitializer } from "./db-initializer";
import { Construct } from "constructs";

interface InitResourcesProps {
  vpc: ec2.Vpc;
}

export class RDS extends Construct {
  public readonly database: rds.DatabaseInstance;
  public dbSecret: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: InitResourcesProps) {
    super(scope, id);

    this.database = this.createDatabase(props, id);
    const initializer = this.createDbCustomResourceInitializer(props);
    this.setPermissionsBetweenResources(initializer);
  }

  private setPermissionsBetweenResources(initializer: CdkResourceInitializer) {
    initializer.customResource.node.addDependency(this.database);
    this.database.connections.allowFrom(
      initializer.dbInitializerFn,
      ec2.Port.tcp(5432)
    );
    this.database.secret?.grantRead(initializer.dbInitializerFn);
  }

  private createDatabase(
    props: InitResourcesProps,
    id: string
  ): rds.DatabaseInstance {
    const instanceIdentifier = "postgres-01";
    const credsSecretName =
      `/${id}/rds/creds/${instanceIdentifier}`.toLowerCase();
    this.dbSecret = new rds.DatabaseSecret(this, "PostgresRdsCredentials", {
      secretName: credsSecretName,
      username: "testUser",
    });

    return new rds.DatabaseInstance(this, "PostgresRdsInstance", {
      vpcSubnets: {
        onePerAz: true,
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      vpc: props.vpc,
      port: 5432,
      databaseName: "todolist",
      allocatedStorage: 10,
      instanceIdentifier,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
    });
  }

  private createDbCustomResourceInitializer(
    props: InitResourcesProps
  ): CdkResourceInitializer {
    const sg = new ec2.SecurityGroup(this, "ResourceInitializerFnSg", {
      securityGroupName: "ResourceInitializerFnSg",
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    return new CdkResourceInitializer(this, "CustomResource", {
      fnLogRetention: logs.RetentionDays.ONE_DAY,
      fnCode: lambda.DockerImageCode.fromImageAsset(
        `${__dirname}/init-code`,
        {}
      ),
      fnTimeout: Duration.minutes(5),
      securityGroups: [sg],
      config: {
        CredsSecretName: this.database.secret?.secretName,
      },
      vpc: props.vpc,
    });
  }
}
