locals {
    tags = {
        Application = "budget_app"
    }

    jwt_authorizer_issuer = "https://securetoken.google.com/${var.firebase_project_id}"
    jwt_authorizer_audience = [var.firebase_project_id]
}


locals {
  env_file = file(var.env_json_filename)

  env = jsondecode(local.env_file)
}