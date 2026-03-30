locals {
    tags = {
        Application = "budget_app"
    }

    jwt_authorizer_issuer = "https://securetoken.google.com/${var.FIREBASE_PROJECT_ID}"
    jwt_authorizer_audience = [var.FIREBASE_PROJECT_ID]

    env = {

    # node environment
    NODE_ENV = var.NODE_ENV,

    # db configuration
    DB_HOST = var.DB_HOST,
    DB_PORT = var.DB_PORT,
    DB_USER = var.DB_USER,
    DB_PASS = var.DB_PASS,
    DB_NAME = var.DB_NAME,
    DB_MAX_CONNECTION = var.DB_MAX_CONNECTION,
    DB_USE_SSL = var.DB_USE_SSL,
    DB_SSL_CA_BASE64 = var.DB_SSL_CA_BASE64

    # client static api keys
    API_KEY_ANDROID = var.API_KEY_ANDROID
    }
}