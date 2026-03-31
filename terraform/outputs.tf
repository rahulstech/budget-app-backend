output "budget_app_storage_cdn_base_url" {
  description = "budget app storage cdn base url"
  value = "https://${aws_cloudfront_distribution.budget_app_storage_distribution.domain_name}"
}