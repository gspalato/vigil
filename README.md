<a id="readme-top"></a>


<br />
<div align="center">
  <a href="https://github.com/gspalato/vigil">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h1 align="center">Vigil</h3>
  <p align="center">
    A health app to track your symptoms and visualize nearby outbreaks.
    <br />
    <a href="https://github.com/gspalato/vigil"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/gspalato/vigil">View Demo</a>
    &middot;
    <a href="https://github.com/gspalato/vigil">Report Bug</a>
    &middot;
    <a href="https://github.com/gspalato/vigil">Request Feature</a>
  </p>
</div>

---

## About

**Vigil** is a polyglot microservice platform that allows users to self-report symptoms, analyzes incoming data for potential disease outbreaks, and visualizes results as a heatmap on an interactive map. It combines statistical and spatial analysis with a modern microservices architecture.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


---

## 🌐 Features

- **User Symptom Reports**: Collect symptoms, severity, demographics, and location.  
- **Statistical Analysis**: Computes disease likelihoods from symptom combinations.  
- **Spatial Analysis & Clustering**: Detects geographic clusters of potential outbreaks.  
- **Real-time Heatmaps**: Provides weighted points for frontend heatmap rendering, alerting users of areas with a high number of reported symptoms and probable diseases.
- **Local Development Workflow**: Uses Tilt for live code reload, kubernetes deployment and, paired with Make, automatic protobuf codegen for each service.
- **Kubernetes-ready**: Supports containerized deployment and local clusters.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🛠️ Built with

<div align="center">
    <a href="https://expo.dev">
        <img src="https://img.shields.io/badge/Expo-000000?logo=Expo&logoColor=white&style=for-the-badge" alt="Expo">
    </a>
    <a href="https://nodejs.com">
        <img src="https://img.shields.io/badge/Node-000000?logo=Node.js&logoColor=white&style=for-the-badge" alt="Node">
    </a>
    <a href="">
        <img src="https://img.shields.io/badge/TypeScript-000000?logo=TypeScript&logoColor=white&style=for-the-badge" alt="TypeScript">
    </a>
    <a href="https://python.org">
        <img src="https://img.shields.io/badge/Python-000000?logo=Python&logoColor=white&style=for-the-badge" alt="Python">
    </a>
    <a href="">
        <img src="https://img.shields.io/badge/gRPC-000000?logo=tRPC&logoColor=white&style=for-the-badge" alt="gRPC">
    </a>
    <a href="https://docker.io">
        <img src="https://img.shields.io/badge/Docker-000000?logo=Docker&logoColor=white&style=for-the-badge" alt="Docker">
    </a>
    <a href="https://kubernetes.io">
        <img src="https://img.shields.io/badge/Kubernetes-000000?logo=Kubernetes&logoColor=white&style=for-the-badge" alt="Kubernetes">
    </a>
    <a href="https://supabase.com">
        <img src="https://img.shields.io/badge/Supabase-000000?logo=Supabase&logoColor=white&style=for-the-badge" alt="Supabase">
    </a>
    <a href="https://clerk.com">
        <img src="https://img.shields.io/badge/Clerk-000000?logo=Clerk&logoColor=white&style=for-the-badge" alt="Clerk">
    </a>
</div>

<p align="right">(<a href="#readme-top">back to top</a>)</p>


---

## 📦 Project Structure


<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🚀 Getting Started

### Prerequisites

- Docker  
- Kubernetes (Kind, Minikube, or similar)  
- Tilt (`brew install tilt-dev/tap/tilt` or Linux install script)  
- Node.js 20+  
- Python 3.12+  
- protoc
- Access to Docker registry (login required if pulling private images)  

### Installation

#### 1. Install gRPC codegen tools
```bash
npm install -g ts-proto
```
```bash
yay -S python-grpcio-tools
```
> ⚠️ Make sure protoc is installed on your system. On macOS: brew install protobuf. On Linux: use your package manager or download from the official site.

#### 2. Clone the repository
```bash
git clone github.com/gspalato/vigil
cd vigil
```

#### 3. Setup secrets and environment variables
Create a `secrets.yaml` file under `infra/k8s/`.
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: secrets
type: Opaque
data:
  CLERK_PUBLISHABLE_KEY: ...
  CLERK_SECRET_KEY: ...
```

#### 4. Generate protobufs
```bash
make all
```

#### 5. Start development with Tilt
```bash
tilt up
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>