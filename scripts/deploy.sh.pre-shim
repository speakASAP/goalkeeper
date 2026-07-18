#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN='[0;32m'
YELLOW='[1;33m'
RED='[0;31m'
BLUE='[0;34m'
NC='[0m'

SERVICE_NAME="goalkeeper"
NAMESPACE="${NAMESPACE:-statex-apps}"
REGISTRY="${REGISTRY:-localhost:5000}"
PORT="${PORT:-3392}"
# Tag describes the WORKING TREE that is actually built, not just git HEAD:
# a tag derived from HEAD alone repeats itself when files changed without a
# commit, which makes `kubectl set image` a no-op and silently keeps the old
# image running.
compute_default_tag() {
  local head dirty root
  root="${PROJECT_ROOT:-$(pwd)}"
  head="$(git -C "$root" rev-parse --short HEAD 2>/dev/null || true)"
  if [ -z "$head" ]; then
    echo "build-$(date -u +%Y%m%d%H%M%S)"
    return
  fi
  dirty="$(git -C "$root" status --porcelain 2>/dev/null || true)"
  if [ -n "$dirty" ]; then
    echo "${head}-wt$(date -u +%Y%m%d%H%M%S)"
  else
    echo "$head"
  fi
}

DEFAULT_TAG="$(compute_default_tag)"
IMAGE_TAG="${1:-$DEFAULT_TAG}"
IMAGE="${REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"
IMAGE_LATEST="${REGISTRY}/${SERVICE_NAME}:latest"
BUILD_IMAGE="${BUILD_IMAGE:-1}"

# shellcheck disable=SC1091
source "$(dirname "$PROJECT_ROOT")/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT" 2>/dev/null   || source "$HOME/Documents/Github/shared/scripts/load-deploy-phase-timing.sh" "$PROJECT_ROOT"   || { echo -e "${RED}Error: deploy timing library not found${NC}" >&2; exit 1; }
deploy_timing_init "$SERVICE_NAME"

KUBECTL="kubectl"
if [ -n "${KUBERNETES_SERVICE_HOST:-}" ]; then
  KUBECONFIG_PATH="${KUBECONFIG:-/home/ssf/.kube/config}"
  KUBECTL="kubectl --kubeconfig=${KUBECONFIG_PATH} --server=https://${KUBERNETES_SERVICE_HOST}:${KUBERNETES_SERVICE_PORT:-443} --insecure-skip-tls-verify=true"
fi
kubectl_exec() { $KUBECTL "$@"; }

preflight_checks() {
  echo -e "${YELLOW}Preflight: checking Kubernetes and required shared services...${NC}"
  kubectl_exec get namespace "$NAMESPACE" >/dev/null
  for service in auth-microservice notifications-microservice docs-rag-microservice db-server-postgres db-server-redis monitoring-microservice; do
    kubectl_exec get service "$service" -n "$NAMESPACE" >/dev/null
  done
  kubectl_exec get clustersecretstore vault-backend >/dev/null
  echo -e "${GREEN}OK Preflight passed${NC}"
}

apply_manifests() {
  for manifest in configmap.yaml external-secret.yaml deployment.yaml service.yaml ingress.yaml; do
    kubectl_exec apply -f "$PROJECT_ROOT/k8s/$manifest" -n "$NAMESPACE"
  done
}

wait_for_secret() {
  echo -e "${YELLOW}Waiting for Vault-backed ExternalSecret...${NC}"
  kubectl_exec wait externalsecret/goalkeeper-secret -n "$NAMESPACE" --for=condition=Ready --timeout=120s
}

health_check() {
  local pod
  pod="$(kubectl_exec get pod -n "$NAMESPACE" -l app="$SERVICE_NAME" --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}')"
  if [ -z "$pod" ]; then
    echo -e "${RED}No running pod found for ${SERVICE_NAME}${NC}"
    exit 1
  fi

  kubectl_exec exec -n "$NAMESPACE" "$pod" -c app -- node -e     "fetch('http://127.0.0.1:${PORT}/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
  kubectl_exec exec -n "$NAMESPACE" "$pod" -c app -- node -e     "fetch('http://127.0.0.1:${PORT}/health/integrations').then(async r=>{const b=await r.json(); process.exit(r.ok && b.status==='ok'?0:1)}).catch(()=>process.exit(1))"
}

public_smoke() {
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="node" "$PROJECT_ROOT/scripts/smoke_test.sh" "https://goalkeeper.alfares.cz"
  else
    echo -e "${YELLOW}WARN node not available for public smoke test; skipping${NC}"
  fi
}

echo -e "${BLUE}==========================================================${NC}"
echo -e "${BLUE}  GoalKeeper - Kubernetes Deployment${NC}"
echo -e "${BLUE}==========================================================${NC}"

deploy_timing_run_phase "Preflight" preflight_checks

if [ "$BUILD_IMAGE" = "1" ]; then
  deploy_timing_phase_start "Build image"
  docker build -t "$IMAGE" -t "$IMAGE_LATEST" "$PROJECT_ROOT"
  deploy_timing_phase_end "Build image"

  deploy_timing_phase_start "Push image"
  docker push "$IMAGE"
  docker push "$IMAGE_LATEST"
  deploy_timing_phase_end "Push image"
else
  echo -e "${YELLOW}Skipping Docker build/push (BUILD_IMAGE=${BUILD_IMAGE})${NC}"
fi

deploy_timing_run_phase "Apply Kubernetes manifests" apply_manifests
deploy_timing_run_phase "Wait for Vault secret" wait_for_secret

deploy_timing_phase_start "Update deployment image"
if [ "$BUILD_IMAGE" = "1" ]; then
  kubectl_exec set image deployment/${SERVICE_NAME} app="$IMAGE" -n "$NAMESPACE"
else
  kubectl_exec rollout restart deployment/${SERVICE_NAME} -n "$NAMESPACE"
fi
deploy_timing_phase_end "Update deployment image"

deploy_timing_phase_start "Wait for rollout"
deploy_timing_k8s_rollout_wait kubectl_exec "$SERVICE_NAME" "$NAMESPACE" "180s"
deploy_timing_phase_end "Wait for rollout"

deploy_timing_run_phase "Health checks" health_check
deploy_timing_run_phase "Public smoke" public_smoke

deploy_timing_finish_success "GoalKeeper"
echo "Image: ${IMAGE}"
echo "URL:   https://goalkeeper.alfares.cz"
DEPLOY_TIMING_FINISHED=1
exit 0
