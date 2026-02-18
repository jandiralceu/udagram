# 🎡 Udagram Orchestration - Kubernetes (K8s)

This directory defines the **Infrastructure-as-Code (IaC)** layer for the Udagram platform. It utilizes Kubernetes to orchestrate a distributed system of microservices, ensuring high availability, elastic scaling, and automated lifecycle management.

---

## 🏗️ Cloud-Native Architecture

The platform architecture is designed for **High Availability (HA)** and **Fault Tolerance**, leveraging EKS (Elastic Kubernetes Service) features:

### Orchestration Strategy

- **Namespace Isolation**: All resources are encapsulated in the `udagram` namespace.
- **Service Mesh (Simplified)**: Internal communication via ClusterIP and standard DNS discovery.
- **Edge Layer**: Nginx-based Reverse Proxy acting as an **API Gateway** with ELB (Elastic Load Balancer) integration.

### Service Matrix

| Service           | Responsibility        | Type           | Replicas (HPA) | Scaling Metric |
| :---------------- | :-------------------- | :------------- | :------------- | :------------- |
| **Reverse Proxy** | API Gateway / Routing | `LoadBalancer` | 2 - 5          | CPU 50%        |
| **Frontend**      | React SPA Host        | `LoadBalancer` | 2 - 5          | CPU 50%        |
| **User API**      | Identity & Profiles   | `ClusterIP`    | 2 - 5          | CPU 50%        |
| **Feed API**      | Content & Media       | `ClusterIP`    | 2 - 5          | CPU 50%        |

---

## 🔐 Configuration & Secret Management

We follow a **Hybrid Configuration Pattern** to balance developer velocity with enterprise-grade security.

### 1. Static Configuration (ConfigMaps)

Non-sensitive data (Endpoint URLs, Region names, App metadata) are managed via declarative ConfigMaps:

- `k8s/udagram-api-user-configmap.yaml`
- `k8s/udagram-api-feed-configmap.yaml`

### 2. Sensitive Data (Manual Secrets)

To prevent **Secret Leakage** in version control, sensitive credentials must be provisioned manually before deployment:

```bash
# Provisioning User Service Credentials
kubectl create secret generic udagram-api-user-secret \
  --namespace udagram \
  --from-literal=DB_CONNECTION_STRING='<POSTGRES_URL>' \
  --from-literal=AWS_ACCESS_KEY_ID='<IAM_KEY>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<IAM_SECRET>'

# Provisioning Feed Service Credentials
kubectl create secret generic udagram-api-feed-secret \
  --namespace udagram \
  --from-literal=DB_CONNECTION_STRING='<POSTGRES_URL>' \
  --from-literal=AWS_ACCESS_KEY_ID='<IAM_KEY>' \
  --from-literal=AWS_SECRET_ACCESS_KEY='<IAM_SECRET>'
```

> **Note:** Production environments additionally fetch dynamic secrets from **AWS Secrets Manager** at the application layer.

---

## 🚀 Deployment Orchestration

Deployment follows a specific order to ensure cross-service dependencies are satisfied.

### Step 1: Foundation

```bash
kubectl apply -f udagram-namespace.yaml
kubectl apply -f *-configmap.yaml
```

### Step 2: Microservices Layer

Deploy components using the standard **Service -> Deployment -> HPA** pattern:

```bash
# Example: Deploying the Feed Microservice
kubectl apply -f udagram-api-feed-service.yaml
kubectl apply -f udagram-api-feed-deployment.yaml
kubectl apply -f udagram-api-feed-hpa.yaml
```

### Step 3: Gateway Layer

```bash
kubectl apply -f udagram-reverseproxy-service.yaml
kubectl apply -f udagram-reverseproxy-deployment.yaml
```

---

## 🛠 Operational Excellence

### Resilience Features

- **Liveness Probes**: Automatically restarts containers that enter a deadlock state.
- **Readiness Probes**: Ensures traffic only flows to Pods that are fully initialized.
- **Rolling Updates**: Configured for Zero-Downtime deployments (maxSurge: 25%, maxUnavailable: 25%).

### Observability Commands

```bash
# Check cluster wide status
kubectl get all -n udagram

# Investigate HPA scaling events
kubectl describe hpa -n udagram

# View aggregated logs from the gateway
kubectl logs -f deployment/udagram-reverseproxy -n udagram
```

---

_This orchestration layer demonstrates advanced proficiency in **Production-Grade Kubernetes**, including Horizontal Pod Autoscaling, Service Discovery, and Decoupled Configuration Management._
