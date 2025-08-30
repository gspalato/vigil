# Generate protos.
local_resource('protogen', 'make all', deps=['proto'])

# Build service images.

docker_build("unreaalism/vigil-analytics", "services/analytics")
docker_build("unreaalism/vigil-digest", "services/digest")
docker_build("unreaalism/vigil-gateway", "services/gateway")
docker_build("unreaalism/vigil-viz", "services/viz")

# Deploy k8s files.
k8s_yaml([
    'infra/k8s/analytics.deployment.yaml',
    'infra/k8s/digest.deployment.yaml',
    'infra/k8s/gateway.deployment.yaml',
    'infra/k8s/viz.deployment.yaml',

    'infra/k8s/analytics.service.yaml',
    'infra/k8s/digest.service.yaml',
    'infra/k8s/gateway.service.yaml',
    'infra/k8s/viz.service.yaml'
])

# Connect gateway to container port 3000
k8s_resource(
  workload='gateway-service',
  port_forwards=3000
)