# Imports
load('ext://helm_resource', 'helm_resource', 'helm_repo')

# Generate protos.
local_resource('protogen', 'make all', deps=['proto'], labels=['jobs'])

# Build service images.

#docker_build("unreaalism/vigil-analytics", "services/analytics",)

docker_build("unreaalism/vigil-ml", "services/ml")

#docker_build("unreaalism/vigil-gateway", "services/gateway")

docker_build("unreaalism/vigil-portal", "services/portal")

# Deploy service files.
k8s_yaml([
    'infra/k8s/apps.namespace.yaml',
    'infra/k8s/jobs.namespace.yaml',
    'infra/k8s/services.namespace.yaml',

    'infra/k8s/portal.deployment.yaml',
    'infra/k8s/portal.service.yaml',
    'infra/k8s/portal.secrets.yaml',
    'infra/k8s/portal.configmap.yaml',
    
    'infra/k8s/ml.deployment.yaml',
    'infra/k8s/ml.service.yaml',
    'infra/k8s/ml.secrets.yaml',

    #'infra/k8s/gateway.deployment.yaml',
    #'infra/k8s/gateway.service.yaml',
    #'infra/k8s/gateway.secrets.yaml',
])

# Connect gateway to container port 3000
#k8s_resource(
#  workload='gateway-service',
#  port_forwards=3000,
#  labels=['services']
#)

# Connect portal to container port 3000
k8s_resource(
  workload='portal-service',
  port_forwards=3000,
  labels=['services']
)

# Connect analytics to container port 50051 (DEVELOPMENT ONLY)
#k8s_resource(
#  workload='analytics-service',
#  port_forwards=50051,
#  labels=['services']
#)

# Connect ML to container port 50051 (DEVELOPMENT ONLY)
k8s_resource(
  workload='ml-service',
  port_forwards=50051,
  labels=['services']
)

# Deploy metrics-server
helm_resource(
  'metrics-server',
  'metrics-server/metrics-server',
  labels=['metrics']
)

# Deploy Headlamp as a dashboard
helm_resource('headlamp', 'headlamp/headlamp')
k8s_resource(workload='headlamp', port_forwards='8080:4466', labels=['dashboards'])

# Deploy ngrok
k8s_yaml([
  'infra/k8s/ngrok.namespace.yaml',
  'infra/k8s/ngrok.secrets.yaml'
])

helm_resource(
    name='ngrok',
    chart='ngrok/ngrok-operator',
    namespace='ngrok-operator',
    labels=['ngrok'],
    resource_deps=['portal-service']
)

k8s_yaml([
  'infra/k8s/ngrok.ingress.yaml',
])

# Clean volumes and system data so that my PC doesn't run out of space.
local_resource(
  'docker_clean',
  'docker system prune -a -f && docker volume prune -a -f',
  labels=['jobs']
)