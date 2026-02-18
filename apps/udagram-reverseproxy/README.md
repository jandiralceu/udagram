# 🌐 Udagram Reverse Proxy

A high-performance **API Gateway** and **Reverse Proxy** built on **Nginx**, serving as the unified entry point for all Udagram microservices.

---

## 🚀 Overview

The **Reverse Proxy** orchestrates incoming traffic from the public internet and routes it to the appropriate internal microservices within the Kubernetes cluster. It simplifies client interaction by providing a single domain for multiple backend services.

### Key Responsibilities

- **Unified API Access**: Routes `/api/v1/users` and `/api/v1/feeds` to their respective microservices.
- **Frontend Serving Proxy**: Routes traffic to the React frontend application.
- **Load Balancing**: Distributes traffic across multiple Pod replicas for high availability.
- **Security & Optimization**: Manages common headers, client body limits, and connection persistence.

---

## 🛠 Technical Configuration

| Feature               | Implementation              | Purpose                                                                              |
| :-------------------- | :-------------------------- | :----------------------------------------------------------------------------------- |
| **Nginx Core**        | Stable Alpine Base          | Minimal footprint and high security.                                                 |
| **Upstream Pools**    | Weighted internal DNS       | Resolves to Kubernetes Service IPs (ClusterIP).                                      |
| **Request Buffering** | 10MB `client_max_body_size` | Specifically configured to allow high-resolution image uploads to the Feed API.      |
| **Domain Routing**    | `server_name` blocks        | Distinguishes between `udagram.jandir.site` (UI) and `udagramapi.jandir.site` (API). |

---

## 🏗 Architecture Details

### The "Unified Entry" Pattern

By using this proxy, the Frontend only needs to know **one** API URL (`udagramapi.jandir.site`). The proxy then intelligently routes:

- Requests starting with `/api/v1/auth` -> **User API**
- Requests starting with `/api/v1/users` -> **User API**
- Requests starting with `/api/v1/feeds` -> **Feed API**

This decoupling allows us to move, scale, or refactor backend services without ever changing the Frontend's configuration.

---

## 🧪 Configuration Management

The proxy is configured via a specialized `nginx.conf` designed for the Udagram environment.

### Header Management

The proxy ensures that critical headers like `X-Real-IP` and `X-Forwarded-For` are correctly passed to the backend, enabling the microservices to accurately log client information despite being behind multiple layers of networking (ELB -> Nginx -> Pod).

---

## ☁️ Deployment

Built for scalability on **AWS EKS**:

- **Service Type**: LoadBalancer.
- **Scalability**: Capable of handling thousands of concurrent connections.
- **Logging**: Configured to stream access and error logs to `stdout/stderr` for centralized log aggregation in AWS CloudWatch.
