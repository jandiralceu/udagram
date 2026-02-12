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
kubectl apply -f udagram-namespace.yaml
kubectl apply -f udagram-secrets.yaml
kubectl apply -f udagram-configmaps.yaml
kubectl apply -f udagram-storage.yaml
kubectl apply -f udagram-api-feed-deployment.yaml
kubectl apply -f udagram-api-user-deployment.yaml
kubectl apply -f udagram-frontend-deployment.yaml
kubectl apply -f udagram-reverseproxy-deployment.yaml
kubectl apply -f udagram-ingress.yaml
```

## Uninstallation

```bash
kubectl delete -f udagram-ingress.yaml
kubectl delete -f udagram-reverseproxy-deployment.yaml
kubectl delete -f udagram-frontend-deployment.yaml
kubectl delete -f udagram-api-user-deployment.yaml
kubectl delete -f udagram-api-feed-deployment.yaml
kubectl delete -f udagram-storage.yaml
kubectl delete -f udagram-configmaps.yaml
kubectl delete -f udagram-secrets.yaml
kubectl delete -f udagram-namespace.yaml
```
