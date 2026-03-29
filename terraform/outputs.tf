output "budget_server_rest_api_base_url" {
  description = "budget server rest api base url"
  value = aws_apigatewayv2_api.budget_server_rest_api.api_endpoint
}

output "budget_app_storage_cdn_base_url" {
  description = "budget app storage cdn base url"
  value = "https://${aws_cloudfront_distribution.budget_app_storage_distribution.domain_name}"
}