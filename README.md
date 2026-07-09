# Cloud Resume Portal on AWS

A fresher-friendly cloud and DevOps portfolio project demonstrating AWS serverless services and an EC2-based web deployment.

## Technologies Used

- Amazon EC2
- Amazon S3
- AWS IAM
- AWS Lambda
- Amazon API Gateway
- Amazon CloudWatch
- AWS CLI
- Amazon Linux
- HTML, CSS, JavaScript
- Node.js and Express.js
- PM2
- Nginx
- Apache HTTP Server
- Browser localStorage

**AWS Region:** `ap-south-1` (Mumbai)

## Architecture

### Serverless Architecture

```text
User → S3 Static Website → API Gateway → AWS Lambda → CloudWatch Logs
```

### EC2 Deployment Architecture

```text
User → EC2 Public IP → Nginx Port 80 → Node.js Port 3000 → PM2
                              ↓
                    Apache Static Hosting
                    /var/www/html
```

## Project Screenshots

### Node.js Application Running on Port 3000

![Cloud Resume Portal running on Node.js port 3000]("C:\Users\Pranjal\Downloads\aws_two_cloud_projects_code\cloud-resume-portal\Screenshot 2026-07-09 213046.png")

The resume portal is deployed on an Amazon Linux EC2 instance. The Node.js application runs on port `3000` and is managed by PM2.

### Nginx Reverse Proxy Running on Port 80

![Cloud Resume Portal through Nginx reverse proxy]("C:\Users\Pranjal\Downloads\aws_two_cloud_projects_code\cloud-resume-portal\Screenshot 2026-07-09 213111.png")

Nginx is configured as a reverse proxy on port `80`, allowing the application to be accessed directly through the EC2 public IP address.

## Folder Structure

```text
cloud-resume-portal/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── lambda/
│   └── lambda_function.py
├── screenshots/
│   ├── cloud-resume-nodejs-port-3000.png
│   └── cloud-resume-nginx-port-80.png
└── README.md
```

## Step 1: Configure AWS CLI

```bash
aws configure
```

Use the following region:

```text
ap-south-1
```

## Step 2: Create an S3 Bucket

S3 bucket names must be globally unique. Replace the example bucket name if it is already in use.

```bash
aws s3 mb s3://pranjal-cloud-resume-portal-123 --region ap-south-1
```

Enable static website hosting:

```bash
aws s3 website s3://pranjal-cloud-resume-portal-123 \
  --index-document index.html
```

Upload the frontend files:

```bash
aws s3 sync frontend/ s3://pranjal-cloud-resume-portal-123
```

For this learning project, disable the bucket-level public-access block:

```bash
aws s3api put-public-access-block \
  --bucket pranjal-cloud-resume-portal-123 \
  --public-access-block-configuration \
  BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

Create a file named `bucket-policy.json`:

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

Apply the bucket policy:

```bash
aws s3api put-bucket-policy \
  --bucket pranjal-cloud-resume-portal-123 \
  --policy file://bucket-policy.json
```

Website URL format:

```text
http://pranjal-cloud-resume-portal-123.s3-website.ap-south-1.amazonaws.com
```

## Step 3: Create an IAM Role for Lambda

Create a file named `trust-policy.json`:

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

Create the IAM role:

```bash
aws iam create-role \
  --role-name cloud-resume-lambda-role \
  --assume-role-policy-document file://trust-policy.json
```

Attach the AWS-managed basic CloudWatch logging policy:

```bash
aws iam attach-role-policy \
  --role-name cloud-resume-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Get the role ARN:

```bash
aws iam get-role \
  --role-name cloud-resume-lambda-role
```

## Step 4: Create the Lambda Function

Zip the Lambda code:

```bash
cd lambda
zip function.zip lambda_function.py
cd ..
```

Create the function. Replace `ROLE_ARN` with the ARN of your Lambda execution role.

```bash
aws lambda create-function \
  --function-name cloud-resume-api \
  --runtime python3.12 \
  --role ROLE_ARN \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda/function.zip \
  --region ap-south-1
```

Test the Lambda function:

```bash
aws lambda invoke \
  --function-name cloud-resume-api \
  --region ap-south-1 \
  response.json

cat response.json
```

## Step 5: Create an API Gateway HTTP API

Create the HTTP API:

```bash
aws apigatewayv2 create-api \
  --name cloud-resume-http-api \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins='["*"]',AllowMethods='["GET","OPTIONS"]',AllowHeaders='["content-type"]' \
  --region ap-south-1
```

Get the Lambda ARN:

```bash
aws lambda get-function \
  --function-name cloud-resume-api \
  --region ap-south-1
```

Create the integration. Replace `API_ID` and `LAMBDA_ARN`.

```bash
aws apigatewayv2 create-integration \
  --api-id API_ID \
  --integration-type AWS_PROXY \
  --integration-uri LAMBDA_ARN \
  --payload-format-version 2.0 \
  --region ap-south-1
```

Create the route. Replace `API_ID` and `INTEGRATION_ID`.

```bash
aws apigatewayv2 create-route \
  --api-id API_ID \
  --route-key 'GET /resume' \
  --target integrations/INTEGRATION_ID \
  --region ap-south-1
```

Create the production stage:

```bash
aws apigatewayv2 create-stage \
  --api-id API_ID \
  --stage-name prod \
  --auto-deploy \
  --region ap-south-1
```

Allow API Gateway to invoke Lambda. Replace `ACCOUNT_ID` and `API_ID`.

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

## Step 6: Connect the Frontend to the API

Open:

```text
frontend/script.js
```

Replace:

```javascript
const API_URL = "PASTE_API_GATEWAY_INVOKE_URL_HERE";
```

with your API Gateway endpoint.

Upload the updated frontend:

```bash
aws s3 sync frontend/ s3://pranjal-cloud-resume-portal-123
```

## Step 7: Check CloudWatch Logs

List the available log groups:

```bash
aws logs describe-log-groups \
  --region ap-south-1
```

The Lambda log group will appear as:

```text
/aws/lambda/cloud-resume-api
```

## EC2 Deployment Summary

The resume portal was also deployed on an Amazon Linux EC2 instance using Node.js and Express.js.

- PM2 manages the Node.js application on port `3000`.
- Nginx listens on port `80` and forwards requests to the Node.js application.
- Apache serves static HTML content from `/var/www/html`.
- EC2 Security Group rules allow the required inbound traffic.

## Resume Bullet Points

- Built and deployed a cloud resume portal using Amazon EC2, S3, HTML, CSS, JavaScript, and Node.js.
- Configured PM2 to manage the Node.js application process on Amazon Linux.
- Configured Nginx as a reverse proxy to route HTTP traffic from port `80` to the Node.js application on port `3000`.
- Configured Apache to host static resume content from `/var/www/html`.
- Developed a Python Lambda function and exposed it through Amazon API Gateway.
- Configured IAM role permissions and enabled CloudWatch logging for monitoring and troubleshooting.
- Used AWS CLI to deploy and manage cloud resources in the `ap-south-1` region.

## Future Improvements

- Add HTTPS using a domain name and SSL/TLS certificate.
- Add a visitor counter using Lambda and DynamoDB.
- Configure a CI/CD pipeline using GitHub Actions.
- Add CloudFront for faster and secure content delivery.
- Add infrastructure automation using Terraform.

## Author

**Pranjal Singh**

MCA Graduate | Cloud & Data Analyst Fresher
