#!/bin/bash

# Default values
REPO="rahulstech/budget-app-backend"
ENV_FILE=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --env-file=*)
      ENV_FILE="${arg#*=}"
      shift
      ;;
    --repo=*)
      REPO="${arg#*=}"
      shift
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# Validate env file
if [ -z "$ENV_FILE" ]; then
  echo "Please provide --env-file=path/to/file.env"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE not found!"
  exit 1
fi

echo "Using env file: $ENV_FILE"
echo "Target repo: $REPO"
echo ""

# Read file line by line
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip empty lines and comments
  if [[ -z "$key" || "$key" =~ ^# ]]; then
    continue
  fi

  # Trim spaces (optional but safer)
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  echo "Setting secret: $key"

  gh secret set "$key" \
    --body "$value" \
    --repo "$REPO"

done < "$ENV_FILE"

echo ""
echo "All secrets pushed successfully!"