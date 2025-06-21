helm upgrade --install gigs --atomic -f .deploy/crds/crd-values.yaml oci://ghcr.io/elcicd/elcicd-chart

helm upgrade --install teknetes-gigs --atomic \
    -f .deploy/teknetes-gigs-controller-values.yaml \
    -f .deploy/pull-secret-values.yaml oci://ghcr.io/elcicd/elcicd-chart 