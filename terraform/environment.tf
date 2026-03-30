variable NODE_ENV {
    type = string
    default = "prod"
}

variable DB_HOST {
    type = string
}

variable DB_PORT {
    type = string
    default = "5432"
}

variable "DB_USER" {
    type = string
}

variable "DB_PASS" {
    type = string
}

variable "DB_NAME" {
    type = string
    default = "budget_db"
}

variable "DB_MAX_CONNECTION" {
    type = string
    default = "20"
}

variable "DB_USE_SSL" {
    type = string
    default = "false"
}

variable "DB_SSL_CA_BASE64" {
    type = string
    default = ""
}

variable "API_KEY_ANDROID" {
    type = string
}

variable "AWS_REGION" {
  type = string
  default = "ap-south-1"
}

variable "FIREBASE_PROJECT_ID" {
    type = string
} 

variable "server_zip_filename" {
  type = string
}