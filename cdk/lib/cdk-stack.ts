import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { OriginAccessIdentity, CloudFrontWebDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { NodejsBuild } from 'deploy-time-build';
import { readFileSync } from 'fs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'UserPool', {
      passwordPolicy: {
        requireUppercase: false,
        requireSymbols: false,
        requireDigits: false,
        minLength: 6,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        username: false,
        email: true,
      },
    });

    const client = userPool.addClient(`Client`, {
      idTokenValidity: cdk.Duration.days(1),
    });

    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: client.userPoolClientId });

    {
      // 1. Build locally
      const parent = new Construct(this, 'LocalBuild');
      const assetBucket = new Bucket(parent, 'AssetBucket', {
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      const originAccessIdentity = new OriginAccessIdentity(parent, 'OriginAccessIdentity');
      const distribution = new CloudFrontWebDistribution(parent, 'Distribution', {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: assetBucket,
              originAccessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/',
          },
          {
            errorCode: 403,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/',
          },
        ],
      });

      new cdk.CfnOutput(parent, 'FrontendUrl', { value: `https://${distribution.distributionDomainName}` });

      const deployment = new BucketDeployment(parent, 'DeployWebsite', {
        sources: [
          Source.asset(path.join('..', 'frontend'), {
            // To build frontend assets properly,
            // you need to populate frontend/.env.local file with the deployed backend attributes first
            bundling: {
              image: cdk.DockerImage.fromRegistry('node:18'),
              // build frontend assets locally during cdk synth
              command: ['sh', '-c', `npm install && npm run build && cp -r out/. /asset-output`],
              user: 'root',
            },
          }),
        ],
        destinationBucket: assetBucket,
        destinationKeyPrefix: '/',
        distribution,
      });
    }

    {
      // 2. Build locally but inject environment variables on runtime
      const parent = new Construct(this, 'RuntimeConfig');
      const assetBucket = new Bucket(parent, 'AssetBucket', {
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      const originAccessIdentity = new OriginAccessIdentity(parent, 'OriginAccessIdentity');
      const distribution = new CloudFrontWebDistribution(parent, 'Distribution', {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: assetBucket,
              originAccessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/',
          },
          {
            errorCode: 403,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/',
          },
        ],
      });

      new cdk.CfnOutput(parent, 'FrontendUrl', { value: `https://${distribution.distributionDomainName}` });

      const deployment = new BucketDeployment(parent, 'DeployWebsite', {
        sources: [
          Source.asset(path.join('..', 'frontend-runtime-config'), {
            bundling: {
              image: cdk.DockerImage.fromRegistry('node:18'),
              // build frontend assets locally during cdk synth
              command: ['sh', '-c', `npm install && npm run build && cp -r out/. /asset-output`],
              user: 'root',
            },
          }),
          Source.jsonData('aws-config.json', {
            region: cdk.Stack.of(this).region,
            userPoolId: userPool.userPoolId,
            userPoolWebClientId: client.userPoolClientId,
          }),
        ],
        destinationBucket: assetBucket,
        destinationKeyPrefix: '/',
        distribution,
      });
    }

    {
      // Build on deploy time
      const parent = new Construct(this, 'DeployTimeBuild');
      const assetBucket = new Bucket(parent, 'AssetBucket', {
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      const originAccessIdentity = new OriginAccessIdentity(parent, 'OriginAccessIdentity');
      const distribution = new CloudFrontWebDistribution(parent, 'Distribution', {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: assetBucket,
              originAccessIdentity,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        errorConfigurations: [
          {
            errorCode: 404,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/',
          },
          {
            errorCode: 403,
            errorCachingMinTtl: 0,
            responseCode: 200,
            responsePagePath: '/',
          },
        ],
      });

      new cdk.CfnOutput(parent, 'FrontendUrl', { value: `https://${distribution.distributionDomainName}` });

      const deployment = new NodejsBuild(parent, 'DeployWebsite', {
        assets: [
          {
            path: path.join('..', 'frontend'),
            exclude: readFileSync(path.join('..', 'frontend', '.gitignore')).toString().split('\n'),
            ignoreMode: cdk.IgnoreMode.GIT,
          },
        ],
        destinationBucket: assetBucket,
        distribution,
        outputSourceDirectory: 'out',
        buildCommands: ['npm ci', 'npm run build'],
        buildEnvironment: {
          NEXT_PUBLIC_AWS_REGION: cdk.Stack.of(this).region,
          NEXT_PUBLIC_USER_POOL_ID: userPool.userPoolId,
          NEXT_PUBLIC_USER_POOL_CLIENT_ID: client.userPoolClientId,
          NEXT_PUBLIC_TITLE: 'Deploy Time Build',
        },
      });
    }
    /**
     * Cloudformaton does not return the serviceName attribute so we extract it from the serviceArn.
     * The ARN comes with this format:
     * arn:aws:apprunner:us-east-1:123456789012:service/SERVICE_NAME/SERVICE_ID
     */
    /*
const sv = new apprunner.CfnService(this, 'Service', {
  ...
});
// The format of attrServiceArn: 
//   "arn:aws:apprunner:us-east-1:123456789012:service/SERVICE_NAME/SERVICE_ID"
// You CANNOT reference the value on synthesis time
const resourceFullName = sv.attrServiceArn.split(":")[5]; // this does NOT work!
console.log(sv.attrServiceArn) // "${TOKEN[1234]}"
// In the CFn template this will be resolved to: 
//   { "Fn::GetAtt" : [ "Service" , "ServiceArn" ] }
// To interact with the value on deploy time, use CFn intrinsic functions
const resourceFullName = cdk.Fn.select(5, cdk.Fn.split(':', sv.attrServiceArn));
    */
  }
}
