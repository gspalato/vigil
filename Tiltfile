# Imports
load('ext://helm_resource', 'helm_resource', 'helm_repo')

# Generate protos.
local_resource('_protogen', 'make all', deps=['proto'])

# Build service images.

docker_build(
  "unreaalism/vigil-analytics",
  "services/analytics",
  build_args={'NO_CACHE':'1'},
  #dockerfile='./services/analytics/Dockerfile',
  #only=['./services/analytics'],
  #live_update=[
  #    sync('./services/analytics', '/app/'),
  #    run(
  #        'pip install -r /app/requirements.txt',
  #        trigger=['./services/analytics/requirements.txt']
  #    )
  #]
)
docker_build("unreaalism/vigil-digest", "services/digest")
docker_build("unreaalism/vigil-gateway", "services/gateway")

# Deploy k8s files.
k8s_yaml([
    'infra/k8s/analytics.deployment.yaml',
    'infra/k8s/digest.deployment.yaml',
    'infra/k8s/gateway.deployment.yaml',

    'infra/k8s/analytics.service.yaml',
    'infra/k8s/digest.service.yaml',
    'infra/k8s/gateway.service.yaml',

    'infra/k8s/ngrok.ingress.yaml',

    'infra/k8s/analytics.secrets.yaml',
    'infra/k8s/gateway.secrets.yaml',
    'infra/k8s/ngrok.secrets.yaml'
])

# Connect gateway to container port 3000
k8s_resource(
  workload='gateway-service',
  port_forwards=3000
)

# Connect analytics to container port 50051 (DEVELOPMENT ONLY)
k8s_resource(
  workload='analytics-service',
  port_forwards=50051
)

# Deploy metrics-server
helm_resource('metrics-server', 'metrics-server/metrics-server')

# Deploy Headlamp as a dashboard
helm_resource('headlamp', 'headlamp/headlamp')
k8s_resource(workload='headlamp', port_forwards='8080:4466')

# Deploy ngrok
helm_resource('ngrok', 'ngrok/ngrok-operator')

# Clean volumes and system data so that my PC doesn't run out of space.
local_resource('_clean', 'docker system prune -a -f && docker volume prune -a -f')