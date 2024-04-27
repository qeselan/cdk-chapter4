import { RDS } from "../RDS";
import { Route53 } from "../Route53";
import { ACM } from "../ACM";
import { InstanceType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  Protocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { CfnOutput, Duration, RemovalPolicy } from "aws-cdk-lib";
import { resolve } from "path";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";

import { backend_subdomain, domain_name } from "../../../../config.json";

interface Props {
  vpc: Vpc;
  rds: RDS;
  acm: ACM;
  route53: Route53;
}

export class Backend extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly task_definition: ecs.Ec2TaskDefinition;
  public readonly container: ecs.ContainerDefinition;
  public readonly service: ecs.Ec2Service;
  public readonly load_balancer: ApplicationLoadBalancer;
  public readonly listener: ApplicationListener;
  public readonly log_group: LogGroup;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.log_group = new LogGroup(scope, "ECSLogGroup", {
      logGroupName: "backend-log",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.cluster = new ecs.Cluster(scope, "EcsCluster", { vpc: props.vpc });

    this.cluster.addCapacity("BackendGroup", {
      instanceType: new InstanceType("t2.micro"),
    });

    this.task_definition = new ecs.Ec2TaskDefinition(
      scope,
      "BackendTaskDefinition"
    );

    this.container = this.task_definition.addContainer("Express", {
      image: ecs.ContainerImage.fromAsset(
        resolve(__dirname, "..", "..", "..", "..", "api")
      ),
      memoryLimitMiB: 256,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: "chapter4",
        logGroup: this.log_group,
      }),
      environment: {
        RDS_HOST: props.rds.database.instanceEndpoint.hostname,
      },
    });

    this.container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    this.service = new ecs.Ec2Service(scope, "BackendService", {
      cluster: this.cluster,
      taskDefinition: this.task_definition,
    });

    this.load_balancer = new ApplicationLoadBalancer(
      scope,
      "BackendLoadBalancer",
      {
        vpc: props.vpc,
        internetFacing: true,
      }
    );

    this.listener = this.load_balancer.addListener("PublicListener", {
      port: 443,
      certificates: [props.acm.certificate],
    });

    this.listener.addTargets("BackendECS", {
      protocol: ApplicationProtocol.HTTP,
      targets: [
        this.service.loadBalancerTarget({
          containerName: "Express",
          containerPort: 80,
        }),
      ],
      healthCheck: {
        protocol: Protocol.HTTP,
        path: "/health",
        timeout: Duration.seconds(10),
        unhealthyThresholdCount: 5,
        healthyThresholdCount: 5,
        interval: Duration.seconds(60),
      },
    });

    new ARecord(this, "BackendAliasRecord", {
      zone: props.route53.hosted_zone,
      target: RecordTarget.fromAlias(
        new LoadBalancerTarget(this.load_balancer)
      ),
      recordName: `${backend_subdomain}.${domain_name}`,
    });

    new CfnOutput(scope, "BackendURL", {
      value: this.load_balancer.loadBalancerDnsName,
    });
  }
}
