import { Construct } from "constructs";
import { ACM } from "../ACM";
import { Route53 } from "../Route53";
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { resolve } from "path";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";

import { domain_name, frontend_subdomain } from "../../../../config.json";

interface Props {
  acm: ACM;
  route53: Route53;
}

export class Frontend extends Construct {
  public readonly web_bucket: Bucket;
  public readonly web_bucket_deployment: BucketDeployment;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.web_bucket = new Bucket(scope, "WebBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      autoDeleteObjects: true,
    });

    this.web_bucket_deployment = new BucketDeployment(
      scope,
      "WebBucketDeployment",
      {
        sources: [
          Source.asset(
            resolve(__dirname, "..", "..", "..", "..", "web", "build")
          ),
        ],
        destinationBucket: this.web_bucket,
      }
    );

    this.distribution = new Distribution(scope, "Frontend-Distribution", {
      certificate: props.acm.certificate,
      domainNames: [`${frontend_subdomain}.${domain_name}`],
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(this.web_bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    new ARecord(scope, "FrontendAliasRecord", {
      zone: props.route53.hosted_zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      recordName: `${frontend_subdomain}.${domain_name}`,
    });

    new CfnOutput(scope, "FrontendURL", {
      value: this.web_bucket.bucketWebsiteUrl,
    });
  }
}
