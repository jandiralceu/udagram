# Kubernetes Configuration

This directory contains the Kubernetes configuration files for the Udagram application.

## Services

- `udagram-api-feed-service.yaml`: Service for the feed API.
- `udagram-api-user-service.yaml`: Service for the user API.
- `udagram-frontend-service.yaml`: Service for the frontend.
- `udagram-reverseproxy-service.yaml`: Service for the reverse proxy.

## Deployments

- `udagram-api-feed-deployment.yaml`: Deployment for the feed API.
- `udagram-api-user-deployment.yaml`: Deployment for the user API.
- `udagram-frontend-deployment.yaml`: Deployment for the frontend.
- `udagram-reverseproxy-deployment.yaml`: Deployment for the reverse proxy.

## Ingress

- `udagram-ingress.yaml`: Ingress configuration for the application.

## Secrets

- `udagram-secrets.yaml`: Secrets for the application.

## ConfigMaps

- `udagram-configmaps.yaml`: ConfigMaps for the application.

## Storage

- `udagram-storage.yaml`: Storage configuration for the application.

## Namespaces

- `udagram-namespace.yaml`: Namespace for the application.

## Installation

```bash
# Create namespace first
kubectl apply -f udagram-namespace.yaml
```

```bash
# Apply all other resources
kubectl apply \
  -f udagram-secrets.yaml \
  -f udagram-configmaps.yaml \
  -f udagram-storage.yaml \
  -f udagram-api-feed-deployment.yaml \
  -f udagram-api-user-deployment.yaml \
  -f udagram-frontend-deployment.yaml \
  -f udagram-reverseproxy-deployment.yaml \
  -f udagram-ingress.yaml
```

## Uninstallation

```bash
# Delete all resources except namespace
kubectl delete \
  -f udagram-ingress.yaml \
  -f udagram-reverseproxy-deployment.yaml \
  -f udagram-frontend-deployment.yaml \
  -f udagram-api-user-deployment.yaml \
  -f udagram-api-feed-deployment.yaml \
  -f udagram-storage.yaml \
  -f udagram-configmaps.yaml \
  -f udagram-secrets.yaml
```

```bash
# Delete namespace last
kubectl delete -f udagram-namespace.yaml
```
