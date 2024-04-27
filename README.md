# Sample Application with FrontEnd and Backend

This repository shows a sample application provides exmaple aws cdk code to deploy it. CDK code deploys the containerized express application on fargate in a private subnet. The application load balancer acts as the ingress to the cluster. No NAT Gateway is being used since all the outbound traffic from cluster is handled through VPC endpoints. On the other side, assets for the website located on a public S3 bucket.
