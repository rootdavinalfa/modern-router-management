# Kubernetes Deployment for Modern Router Management

This folder contains Kubernetes manifests for deploying the Modern Router Management API.

## Structure

```
kubernetes/
├── base/                       # Base configuration (all files in root)
│   ├── namespace.yaml          # Namespace definition
│   ├── postgresql.yaml         # PostgreSQL StatefulSet + Service
│   ├── api-deployment.yaml     # API Deployment + Service
│   ├── ingress.yaml            # Ingress for external access
│   ├── secrets.template.yaml   # Secrets template (DO NOT COMMIT REAL SECRETS)
│   └── kustomization.yaml      # Kustomize configuration
└── production/                 # Production overlays
    └── kustomization.yaml      # Production-specific patches
```

## Prerequisites

- Kubernetes cluster (v1.25+)
- kubectl configured
- Ingress controller (nginx-ingress recommended)
- cert-manager (for TLS certificates)

## Quick Start

### 1. Create Secrets

**Option A: Manual creation**
```bash
# Generate encryption key
openssl rand -base64 32

# Create secrets manually
kubectl create namespace modern-router-mgmt
kubectl create secret generic postgres-secret \
  --namespace=modern-router-mgmt \
  --from-literal=username=postgres \
  --from-literal=password='YOUR_STRONG_PASSWORD' \
  --from-literal=database=modern_router_mgmt \
  --from-literal=connection-string='postgresql://postgres:YOUR_STRONG_PASSWORD@postgresql:5432/modern_router_mgmt'

kubectl create secret generic api-secret \
  --namespace=modern-router-mgmt \
  --from-literal=credentials-key='YOUR_GENERATED_KEY'
```

**Option B: Using Sealed Secrets (Recommended)**
```bash
# Install kubeseal
brew install kubeseal

# Create sealed secrets
kubeseal --format=yaml < kubernetes/secrets.template.yaml > kubernetes/sealed-secrets.yaml
kubectl apply -f kubernetes/sealed-secrets.yaml
```

### 2. Deploy with Kustomize

**Development/Testing:**
```bash
kubectl apply -k kubernetes/
```

**Production:**
```bash
kubectl apply -k kubernetes/production/
```

### 3. Verify Deployment

```bash
# Check pods
kubectl get pods -n modern-router-mgmt

# Check services
kubectl get svc -n modern-router-mgmt

# Check ingress
kubectl get ingress -n modern-router-mgmt

# View logs
kubectl logs -n modern-router-mgmt -l app=modern-router-api -f
```

### 4. Access the API

**Via port-forward (testing):**
```bash
kubectl port-forward -n modern-router-mgmt svc/modern-router-api 3001:80
curl http://localhost:3001/health
```

**Via Ingress (production):**
```bash
curl https://api.example.com/health
```

## Configuration

### Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | ConfigMap | Environment (production) |
| `PORT` | ConfigMap | API port (3001) |
| `DB_ENGINE` | ConfigMap | Database engine (postgres) |
| `DATABASE_URL` | Secret | PostgreSQL connection string |
| `ROUTER_CREDENTIALS_KEY` | Secret | Encryption key for credentials |

### Resource Limits

**Development:**
- API: 512Mi - 1Gi memory, 200m - 1000m CPU
- PostgreSQL: 256Mi - 512Mi memory, 100m - 500m CPU

**Production:**
- API: 1Gi - 2Gi memory, 500m - 2000m CPU (3 replicas)
- PostgreSQL: 512Mi - 1Gi memory, 250m - 1000m CPU

## Scaling

### Manual Scaling

```bash
# Scale API replicas
kubectl scale deployment modern-router-api -n modern-router-mgmt --replicas=5
```

### Horizontal Pod Autoscaler

Create `hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: modern-router-api-hpa
  namespace: modern-router-mgmt
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: modern-router-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## Monitoring

```bash
# Check pod status
kubectl top pods -n modern-router-mgmt

# Check node resources
kubectl top nodes

# View events
kubectl get events -n modern-router-mgmt --sort-by='.lastTimestamp'
```

## Troubleshooting

### Pod not starting
```bash
# Describe pod for events
kubectl describe pod -n modern-router-mgmt -l app=modern-router-api

# Check logs
kubectl logs -n modern-router-mgmt -l app=modern-router-api
```

### Database connection issues
```bash
# Test PostgreSQL connectivity
kubectl run -n modern-router-mgmt -it --rm --image=postgres:16-alpine --restart=Never -- psql -h postgresql -U postgres -d modern_router_mgmt
```

### Ingress not working
```bash
# Check ingress status
kubectl describe ingress -n modern-router-mgmt

# Verify ingress controller
kubectl get pods -n ingress-nginx
```

## Backup & Restore

### Backup PostgreSQL
```bash
kubectl run -n modern-router-mgmt postgres-backup \
  --image=postgres:16-alpine \
  --env=PGPASSWORD=$(kubectl get secret postgres-secret -n modern-router-mgmt -o jsonpath='{.data.password}' | base64 -d) \
  --rm -it --restart=Never -- \
  pg_dump -h postgresql -U postgres modern_router_mgmt > backup.sql
```

### Restore PostgreSQL
```bash
kubectl run -n modern-router-mgmt postgres-restore \
  --image=postgres:16-alpine \
  --env=PGPASSWORD=$(kubectl get secret postgres-secret -n modern-router-mgmt -o jsonpath='{.data.password}' | base64 -d) \
  --rm -i --restart=Never -- \
  psql -h postgresql -U postgres modern_router_mgmt < backup.sql
```

## Security Notes

- Never commit actual secrets to version control
- Use Sealed Secrets or External Secrets Operator for production
- Enable network policies to restrict pod-to-pod communication
- Use Pod Security Policies/Standards for additional security
- Regularly rotate credentials and encryption keys
