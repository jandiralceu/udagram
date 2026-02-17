# Udagram Infrastructure - Kubernetes

This directory centralizes the Kubernetes (K8s) infrastructure orchestration for the Udagram application. The architecture follows cloud-native principles, ensuring scalability, resilience, and strict separation of concerns across microservices.

## 🏗️ Deployment Architecture

The infrastructure is designed using modular components within the `udagram` namespace for isolation.

### Service Inventory

| Component     | Manifests                 | Description                                        |
| :------------ | :------------------------ | :------------------------------------------------- |
| **Namespace** | `udagram-namespace.yaml`  | Dedicated resource isolation.                      |
| **User API**  | `udagram-api-user-*.yaml` | Handles authentication and profiles.               |
| **Feed API**  | `udagram-api-feed-*.yaml` | Core logic for feed management and media handling. |

### Microservices Specification

| Service      | Deployment Strategy | Auto-scaling     | Internal DNS                                 |
| :----------- | :------------------ | :--------------- | :------------------------------------------- |
| **User API** | RollingUpdate       | 2 - 5 Pods (HPA) | `udagram-api-user.udagram.svc.cluster.local` |
| **Feed API** | RollingUpdate       | 2 - 5 Pods (HPA) | `udagram-api-feed.udagram.svc.cluster.local` |

## 🔐 Secrets Management (Security Best Practices)

In alignment with **DevSecOps** principles, credentials are provisioned manually via CLI to prevent sensitive data from being stored in version control.

### Provisioning Credentials

Execute the following commands to provision secrets for both services:

```bash
# User API Secrets
kubectl create secret generic udagram-api-user-secret \
  --namespace udagram \
  --from-literal=DB_CONNECTION_STRING='<USER_DB_URL>' \
  --from-literal=AWS_ACCESS_KEY_ID='<AWS_KEY>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<AWS_SECRET>'

# Feed API Secrets
kubectl create secret generic udagram-api-feed-secret \
  --namespace udagram \
  --from-literal=DB_CONNECTION_STRING='<FEED_DB_URL>' \
  --from-literal=AWS_ACCESS_KEY_ID='<AWS_KEY>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<AWS_SECRET>'
```

## 🚀 Deployment Guide

### 1. Initialize Infrastructure

```bash
kubectl apply -f udagram-namespace.yaml
```

### 2. Configure Environment

```bash
kubectl apply -f udagram-api-user-configmap.yaml
kubectl apply -f udagram-api-feed-configmap.yaml
```

### 3. Deploy and Scale Services

```bash
# User Service
kubectl apply -f udagram-api-user-service.yaml
kubectl apply -f udagram-api-user-deployment.yaml
kubectl apply -f udagram-api-user-hpa.yaml

# Feed Service
kubectl apply -f udagram-api-feed-service.yaml
kubectl apply -f udagram-api-feed-deployment.yaml
kubectl apply -f udagram-api-feed-hpa.yaml
```

### 4. Monitoring & Verification

```bash
# Verify deployments and HPA
kubectl get all -n udagram

# Monitor scaling events
kubectl get hpa -w -n udagram
```

---

_Note: This architecture demonstrates proficiency in multi-service microservice orchestration, service discovery, and elastic scaling in Kubernetes._
