FROM registry.access.redhat.com/ubi9/nginx-120:latest
USER root

ARG OKD_VERSION=4
ARG OC_CLI_URL=https://mirror.openshift.com/pub/openshift-v${OKD_VERSION}/clients/oc/latest/linux/oc.tar.gz

COPY dist /usr/share/nginx/html

RUN dnf install --nodocs -y jq && \
    curl -fsSLo /tmp/oc.tar.gz ${OC_CLI_URL} && \
    tar -C /usr/local/bin/ -xf /tmp/oc.tar.gz  'oc' 'kubectl' && \
    dnf clean all && \
    rm /tmp/oc.tar.gz

USER 1001

ENTRYPOINT ["nginx", "-g", "daemon off;"]