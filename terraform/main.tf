terraform {
  required_version = "~> 1.14.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 6.37.0"
    }
  }


  backend "s3" {
    bucket         = "terraform-state-825765402259-ap-south-1-an"
    key            = "budget-app/terraform-state/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.AWS_REGION
}



###########################################
###                 S3                  ###
########################################### 

resource "aws_s3_bucket" "budget_app_storage" {

    bucket = "storage-budget-app"

    tags = {
        Application = local.tags.Application
    }
}

resource "aws_s3_bucket_lifecycle_configuration" "clean_temp_directory" {
  bucket = aws_s3_bucket.budget_app_storage.id 

  rule {
    id = "clean-temp-directory"
    status = "Enabled"

    filter {
        prefix = "temp/"
    }

    expiration {
        days = 1
    }
  }
}



###########################################
###            Cloudfront               ###
###########################################

resource "aws_cloudfront_origin_access_control" "oac_budget_app_storage" {
  name = "oac_buget_app_storage"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}

resource "aws_cloudfront_distribution" "budget_app_storage_distribution" {

    enabled = true

    origin {
      domain_name = aws_s3_bucket.budget_app_storage.bucket_regional_domain_name
      origin_id = "origin-storage-budget-app"

      origin_access_control_id = aws_cloudfront_origin_access_control.oac_budget_app_storage.id
    }

    default_cache_behavior {
       target_origin_id = "origin-storage-budget-app"

       viewer_protocol_policy = "redirect-to-https"

       allowed_methods = ["GET","HEAD"]
       cached_methods = ["GET","HEAD"]

       forwarded_values {
         query_string = false

         cookies {
           forward = "none"
         }
       }
    }

    viewer_certificate {
      cloudfront_default_certificate = true
    }

    restrictions {
      
      geo_restriction {
        restriction_type = "none"
      }
    }

    tags = {
      Application = local.tags.Application
    }
}

resource "aws_s3_bucket_policy" "budget_app_storage_policy" {
  bucket = aws_s3_bucket.budget_app_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action   = "s3:GetObject",
        Resource = "${aws_s3_bucket.budget_app_storage.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "${aws_cloudfront_distribution.budget_app_storage_distribution.arn}"
          }
        }
      }
    ]
  })
}



###########################################
###            CloudWatch               ###
###########################################

# Log group for lambda server
resource "aws_cloudwatch_log_group" "budget_server_log_group" {
  name              = "/aws/lambda/budget_server"
  retention_in_days = 7 

  tags = {
    Application = local.tags.Application
  }
}

# Log group for API Gateway
resource "aws_cloudwatch_log_group" "budget_server_rest_api_log_group" {
  name              = "/aws/apigateway/budget_server_rest_api"
  retention_in_days = 7

  tags = {
    Application = local.tags.Application
  }
}



###########################################
###               Lambda                ###
###########################################

# create a execution role

resource "aws_iam_role" "budget_server_lambda_execution_role" {
  name = "budget_server_lambda_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
        {
            Effect = "Allow",
            Principal = {
                Service = "lambda.amazonaws.com"
            },
            Action = "sts:AssumeRole"
        }
    ]
  })
}

# attach necessary permision to execution role

resource "aws_iam_role_policy" "lambda_logs" {
  role = aws_iam_role.budget_server_lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_s3_access" {
  role = aws_iam_role.budget_server_lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.budget_app_storage.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "budget_server_policies" {
  role = aws_iam_role.budget_server_lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"  
}

resource "aws_lambda_function" "budget_server" {
  function_name = "budget_server"

  filename = var.server_zip_filename
  
  source_code_hash = filebase64sha256(var.server_zip_filename)

  runtime = "nodejs22.x"

  handler = "index.handler"

  role = aws_iam_role.budget_server_lambda_execution_role.arn

  environment {
    variables = merge(
      local.env,
      {
        BASE_URL = aws_apigatewayv2_api.budget_server_rest_api.api_endpoint,

        S3_REGION = var.AWS_REGION,
        S3_BUCKET  = aws_s3_bucket.budget_app_storage.bucket
        CDN_BASE_URL = "https://${aws_cloudfront_distribution.budget_app_storage_distribution.domain_name}"
      }
    )
  }
  
  tags = {
    Application = local.tags.Application
  }

  depends_on = [
    aws_cloudwatch_log_group.budget_server_log_group,
    aws_iam_role_policy.lambda_logs  # ensures permissions are also ready
  ]
}



###########################################
###            API Gateway              ###
###########################################


resource "aws_apigatewayv2_api" "budget_server_rest_api" {
  name = "budget_server_rest_api"
  protocol_type = "HTTP"

  tags = {
    Application = local.tags.Application
  }
}

# ----------------------------------
# permissions
# ----------------------------------

resource "aws_lambda_permission" "invoke_budget_server_permission" {
  statement_id = "AllowAPIGatewayInvoke"
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.budget_server.function_name
  principal = "apigateway.amazonaws.com"
  
  # NOTE: trailing /*/* means
  # any stage
  # any http method
  # any route
  source_arn = "${aws_apigatewayv2_api.budget_server_rest_api.arn}/*/*"
}




# IAM role that allows API Gateway to push logs to CloudWatch
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "api_gateway_cloudwatch_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_policy" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Account-level setting — links the IAM role to API Gateway
resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}





# ----------------------------------
# stages
# ----------------------------------

resource "aws_apigatewayv2_stage" "budget_server_stage_default" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id
  name = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.budget_server_log_group.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      path           = "$context.path"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    }) 
  }

  depends_on = [ aws_api_gateway_account.api_gateway_account ]
}

# ----------------------------------
# integrations
# ----------------------------------

resource "aws_apigatewayv2_integration" "budget_server_integration" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  integration_type = "AWS_PROXY"
  integration_uri = aws_lambda_function.budget_server.invoke_arn
}

# ----------------------------------
# authorizers
# ----------------------------------

resource "aws_apigatewayv2_authorizer" "jwt_authorizer" {
  name = "jwt_authorizer"
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  authorizer_type = "JWT"

  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    issuer = local.jwt_authorizer_issuer
    audience = local.jwt_authorizer_audience
  }
}

# ----------------------------------
# routes
# ----------------------------------


# no auth routes

resource "aws_apigatewayv2_route" "route_profiles" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  route_key = "GET /profiles"

  target = "integrations/${aws_apigatewayv2_integration.budget_server_integration.id}"
}


# auth routes

resource "aws_apigatewayv2_route" "route_budget" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  route_key = "POST /budget"

  target = "integrations/${aws_apigatewayv2_integration.budget_server_integration.id}"

  authorization_type = "JWT"
  authorizer_id = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "route_budgets" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  route_key = "ANY /budgets"

  target = "integrations/${aws_apigatewayv2_integration.budget_server_integration.id}"

  authorization_type = "JWT"
  authorizer_id = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "route_events" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  route_key = "ANY /events"

  target = "integrations/${aws_apigatewayv2_integration.budget_server_integration.id}"

  authorization_type = "JWT"
  authorizer_id = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_route" "route_user" {
  api_id = aws_apigatewayv2_api.budget_server_rest_api.id

  route_key = "ANY /user"

  target = "integrations/${aws_apigatewayv2_integration.budget_server_integration.id}"

  authorization_type = "JWT"
  authorizer_id = aws_apigatewayv2_authorizer.jwt_authorizer.id
}