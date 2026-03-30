#!/bin/bash

REPO="rahulstech/budget-app-backend"

echo "Fetching all secrets from $REPO..."

# Get all secret names
secrets=$(gh secret list --repo "$REPO" --json name -q '.[].name')

if [ -z "$secrets" ]; then
  echo "No secrets found."
  exit 0
fi

echo "The following secrets will be deleted:"
echo "$secrets"
echo ""

# Confirmation
read -p "Type YES to continue: " confirm

if [ "$confirm" != "YES" ]; then
  echo "Aborted."
  exit 1
fi

# Delete secrets
for secret in $secrets; do
  echo "Deleting $secret"
  gh secret delete "$secret" --repo "$REPO"
done

echo "All secrets deleted successfully!"