# deploy.config.sh — declaration consumed by shared/scripts/deploy.sh.
# See shared/docs/DEPLOY_STANDARDIZATION_REPORT.md section 6 for the design.
#
# Phase B pilot (report section 7) — chosen because it needs a phase-ordering
# hook the initial design didn't have (wait for its Vault ExternalSecret
# between manifest-apply and set-image), which is exactly what surfaced the
# need for deploy_post_manifests. scripts/deploy.sh is still the live,
# authoritative deploy path.

SERVICE_NAME="goalkeeper"
PORT="3392"
HEALTH_PATH="/health"

# image[i] = "image-name|build-context|dockerfile|extra-docker-args"
IMAGES=(
  "goalkeeper|.||"
)

# deployment[i] = "k8s-deployment|container|image-name"
DEPLOYMENTS=(
  "goalkeeper|app|goalkeeper"
)

deploy_preflight() {
  for svc in auth-microservice notifications-microservice docs-rag-microservice \
             db-server-postgres db-server-redis monitoring-microservice; do
    kubectl get service "$svc" -n "$NAMESPACE" >/dev/null
  done
  kubectl get clustersecretstore vault-backend >/dev/null
}

deploy_post_manifests() {
  kubectl wait "externalsecret/${SERVICE_NAME}-secret" -n "$NAMESPACE" \
    --for=condition=Ready --timeout=120s
}

# deploy_verify_health covers GET /health; the real script also checks
# /health/integrations and runs a public smoke test against the live domain.
deploy_post_verify() {
  local pod
  pod=$(kubectl get pod -n "$NAMESPACE" -l "app=${SERVICE_NAME}" --field-selector=status.phase=Running \
    -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -n "$NAMESPACE" "$pod" -c app -- node -e \
    "fetch('http://127.0.0.1:${PORT}/health/integrations').then(async r=>{const b=await r.json(); process.exit(r.ok && b.status==='ok'?0:1)}).catch(()=>process.exit(1))"
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="node" "$PROJECT_ROOT/scripts/smoke_test.sh" "https://goalkeeper.alfares.cz"
  fi
}
