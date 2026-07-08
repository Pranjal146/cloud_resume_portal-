# Cloud Resume Portal on AWS

This project is a fresher-friendly AWS project using:

- Amazon S3
- AWS IAM
- AWS Lambda
- Amazon API Gateway
- Amazon CloudWatch
- AWS CLI
- HTML, CSS, JavaScript
- Browser localStorage

Region used: `ap-south-1` Mumbai

## Architecture

User -> S3 Static Website -> API Gateway -> Lambda -> CloudWatch Logs

## Folder Structure

```text
cloud-resume-portal/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── lambda/
│   └── lambda_function.py
└── README.md
```

## Step 1: Configure AWS CLI

```bash
aws configure
```

Use region:

```text
ap-south-1
```

## Step 2: Create S3 Bucket

Bucket names must be globally unique. Replace the bucket name below.

```bash
aws s3 mb s3://pranjal-cloud-resume-portal-123 --region ap-south-1
```

Enable static website hosting:

```bash
aws s3 website s3://pranjal-cloud-resume-portal-123 --index-document index.html
```

Upload frontend files:

```bash
aws s3 sync frontend/ s3://pranjal-cloud-resume-portal-123
```

Make the website files public for learning purpose:

```bash
aws s3api put-public-access-block \
  --bucket pranjal-cloud-resume-portal-123 \
  --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pranjal-cloud-resume-portal-123/*"
    }
  ]
}
```

Apply bucket policy:

```bash
aws s3api put-bucket-policy \
  --bucket pranjal-cloud-resume-portal-123 \
  --policy file://bucket-policy.json
```

Website URL format:

```text
http://pranjal-cloud-resume-portal-123.s3-website.ap-south-1.amazonaws.com
```

## Step 3: Create IAM Role for Lambda

Create `trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create role:

```bash
aws iam create-role \
  --role-name cloud-resume-lambda-role \
  --assume-role-policy-document file://trust-policy.json
```

Attach basic CloudWatch logging permission:

```bash
aws iam attach-role-policy \
  --role-name cloud-resume-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Get role ARN:

```bash
aws iam get-role --role-name cloud-resume-lambda-role
```

## Step 4: Create Lambda Function

Zip Lambda code:

```bash
cd lambda
zip function.zip lambda_function.py
cd ..
```

Create function. Replace ROLE_ARN with your Lambda role ARN.

```bash
aws lambda create-function \
  --function-name cloud-resume-api \
  --runtime python3.12 \
  --role ROLE_ARN \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda/function.zip \
  --region ap-south-1
```

Test Lambda:

```bash
aws lambda invoke \
  --function-name cloud-resume-api \
  --region ap-south-1 \
  response.json

cat response.json
```

## Step 5: Create API Gateway HTTP API

Create API:

```bash
aws apigatewayv2 create-api \
  --name cloud-resume-http-api \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins='["*"]',AllowMethods='["GET","OPTIONS"]',AllowHeaders='["content-type"]' \
  --region ap-south-1
```

Get your Lambda ARN:

```bash
aws lambda get-function --function-name cloud-resume-api --region ap-south-1
```

Create integration. Replace API_ID and LAMBDA_ARN.

```bash
aws apigatewayv2 create-integration \
  --api-id API_ID \
  --integration-type AWS_PROXY \
  --integration-uri LAMBDA_ARN \
  --payload-format-version 2.0 \
  --region ap-south-1
```

Create route. Replace API_ID and INTEGRATION_ID.

```bash
aws apigatewayv2 create-route \
  --api-id API_ID \
  --route-key 'GET /resume' \
  --target integrations/INTEGRATION_ID \
  --region ap-south-1
```

Create stage:

```bash
aws apigatewayv2 create-stage \
  --api-id API_ID \
  --stage-name prod \
  --auto-deploy \
  --region ap-south-1
```

Allow API Gateway to invoke Lambda. Replace ACCOUNT_ID and API_ID.

```bash
aws lambda add-permission \
  --function-name cloud-resume-api \
  --statement-id apigateway-invoke-permission \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn arn:aws:execute-api:ap-south-1:ACCOUNT_ID:API_ID/*/*/resume \
  --region ap-south-1
```

API URL format:

```text
https://API_ID.execute-api.ap-south-1.amazonaws.com/prod/resume
```

## Step 6: Connect Frontend to API

Open:

```text
frontend/script.js
```

Replace:

```javascript
const API_URL = "PASTE_API_GATEWAY_INVOKE_URL_HERE";
```

with your API Gateway URL.

Upload updated frontend:

```bash
aws s3 sync frontend/ s3://pranjal-cloud-resume-portal-123
```

## Step 7: Check CloudWatch Logs

```bash
aws logs describe-log-groups --region ap-south-1
```

Lambda logs will appear in:

```text
/aws/lambda/cloud-resume-api
```

## Resume Bullet Points

- Built a static cloud resume portal using Amazon S3, HTML, CSS, and JavaScript.
- Developed a Python Lambda function and exposed it using Amazon API Gateway.
- Configured IAM role permissions using least-privilege access principles.
- Enabled CloudWatch logging to monitor Lambda execution and troubleshoot API requests.
- Used AWS CLI for deployment and basic cloud resource management in the ap-south-1 region.
