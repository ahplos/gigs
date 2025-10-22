helm upgrade --install gigs --atomic -f .deploy/crds/crd-values.yaml oci://ghcr.io/elcicd/elcicd-chart

helm upgrade --install ahplos-gigs --atomic \
    -f .deploy/ahplos-gigs-controller-values.yaml \
    -f .deploy/pull-secret-values.yaml oci://ghcr.io/elcicd/elcicd-chart