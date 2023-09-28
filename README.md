# Build and Deploy web frontend static assets with AWS CDK
There are three patterns demonstrated in this code.

1. Deploy backend first, then build frontend locally
2. Fetch variables on runtime
3. Build frontend on deploy time

 See [cdk/lib/cdk-stack.ts](./cdk/lib/cdk-stack.ts) for the CDK code.

Pattern #2 requires specific implementation in frontend code. See [frontend-runtime-config](./frontend-runtime-config) for how environment variables are fetched on runtime.

// TODO: Add link to the LT slide
