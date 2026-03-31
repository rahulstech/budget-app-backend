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
