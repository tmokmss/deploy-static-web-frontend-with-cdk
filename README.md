# Build and Deploy web frontend static assets with AWS CDK
There are three patterns demonstrated in this code.

1. Deploy backend first, then build frontend locally
2. Fetch variables on runtime
3. Build frontend on deploy time

 See [cdk/lib/cdk-stack.ts](./cdk/lib/cdk-stack.ts) for the CDK code.

Pattern #2 requires specific implementation in frontend code. See [frontend-runtime-config](./frontend-runtime-config) for how environment variables are fetched on runtime.

## Slides
This repository is a demo used on CDK Day 2023 **"Deploy web frontend apps with AWS CDK"**. talk See the recording or slides below:

[Recording](https://www.youtube.com/live/b-nSH18gFQk?si=ogEZ2x1NixOj6J6j&t=373) | [Slides](https://speakerdeck.com/tmokmss/deploy-web-frontend-apps-with-aws-cdk)
