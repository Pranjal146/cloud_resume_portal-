import json


def lambda_handler(event, context):
    body = {
        "name": "Pranjal",
        "summary": "MCA graduate learning AWS Cloud and DevOps through hands-on projects using S3, IAM, Lambda, API Gateway, CloudWatch, Docker, ECR, ECS, EC2, EFS, and VPC.",
        "skills": [
            "AWS IAM",
            "Amazon S3",
            "AWS Lambda",
            "API Gateway",
            "CloudWatch",
            "Python",
            "Docker",
            "Linux",
            "GitHub"
        ]
    }

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,OPTIONS"
        },
        "body": json.dumps(body)
    }
