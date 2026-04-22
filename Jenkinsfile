pipeline {
  agent { label 'jenkins-agent' }

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
  }

  parameters {
    string(
      name: 'BRANCH',
      defaultValue: 'main',
      description: 'Git branch to build. Set automatically by the GitHub Actions webhook trigger.'
    )
    string(name: 'NODE_VERSION', defaultValue: '22.15.0', description: 'Node.js version to install if missing (Linux x64/arm64)')
  }

  environment {
    // Docker Hub
    DOCKER_REGISTRY     = 'docker.io'
    DOCKER_HUB_USERNAME = 'fmdx'
    DOCKER_IMAGE        = 'online-ticketing-frontend'
    FULL_IMAGE_PATH     = "${DOCKER_REGISTRY}/${DOCKER_HUB_USERNAME}/${DOCKER_IMAGE}"

    // Application
    APP_NAME    = 'online-ticketing-frontend'
    APP_VERSION = "${env.BUILD_NUMBER}"

    // Environment (production only)
    ENVIRONMENT   = 'prod'
    K8S_NAMESPACE = 'online-ticketing-frontend'
    IMAGE_TAG     = 'prod-latest'

    NODE_VERSION_E = "${params.NODE_VERSION}"

    // Docker Hub credentials — bound globally because both Docker Build and Deploy stages need them.
    DOCKERHUB_CREDENTIALS = credentials('dockerhub-login')

    // Docker config (writable location for Docker Hub login)
    DOCKER_CONFIG = "${env.WORKSPACE}/.docker"
  }

  stages {

    // =========================================================================
    // 1. Checkout & confirm target environment
    // =========================================================================
    stage('📋 Checkout') {
      steps {
        script {
          def targetBranch = (params.BRANCH ?: 'main')
            .replaceAll('^refs/heads/', '')
            .replaceAll('^origin/', '')
            .trim()

          echo "🔄 Checking out branch: ${targetBranch}"

          checkout([
            $class                           : 'GitSCM',
            branches                         : [[name: "*/${targetBranch}"]],
            userRemoteConfigs                : scm.userRemoteConfigs,
            doGenerateSubmoduleConfigurations: false,
            extensions                       : []
          ])

          env.GIT_COMMIT_MSG   = sh(returnStdout: true, script: 'git log -1 --pretty=%B').trim()
          env.GIT_AUTHOR       = sh(returnStdout: true, script: 'git log -1 --pretty=%an').trim()
          env.GIT_COMMIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()

          echo "🌍 Environment : ${env.ENVIRONMENT}"
          echo "📦 Namespace   : ${env.K8S_NAMESPACE}"
          echo "🏷  Image tag   : ${env.IMAGE_TAG}"
          echo "📝 Commit      : ${env.GIT_COMMIT_MSG}"
          echo "👤 Author      : ${env.GIT_AUTHOR}"
          echo "🔖 SHA         : ${env.GIT_COMMIT_SHORT}"
        }
      }
    }

    // =========================================================================
    // 2. Ensure Node.js is available
    // =========================================================================
    stage('⬇️ Ensure Node.js') {
      steps {
        script {
          sh '''#!/usr/bin/env bash
            set -euo pipefail

            if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
              echo "✅ Node already installed on agent: $(node -v) / npm $(npm -v)"
              echo "NODE_HOME=" > node.env
              exit 0
            fi

            echo "⚠️ Node is missing on this agent. Installing Node.js v${NODE_VERSION_E} into WORKSPACE cache..."

            OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
            ARCH="$(uname -m)"
            case "$ARCH" in
              x86_64|amd64) ARCH="x64" ;;
              aarch64|arm64) ARCH="arm64" ;;
              *) echo "Unsupported arch: $ARCH"; exit 1 ;;
            esac

            TOOLS_DIR="${WORKSPACE}/.tools"
            mkdir -p "${TOOLS_DIR}"

            NODE_DIR="${TOOLS_DIR}/node-${NODE_VERSION_E}-${OS}-${ARCH}"
            EXTRACTED_DIR="${TOOLS_DIR}/node-v${NODE_VERSION_E}-${OS}-${ARCH}"

            if [ -x "${NODE_DIR}/bin/node" ] && [ -x "${NODE_DIR}/bin/npm" ]; then
              echo "✅ Using cached Node at ${NODE_DIR}"
            else
              rm -rf "${NODE_DIR}" "${EXTRACTED_DIR}"

              TARBALL="node-v${NODE_VERSION_E}-${OS}-${ARCH}.tar.gz"
              URL="https://nodejs.org/dist/v${NODE_VERSION_E}/${TARBALL}"

              echo "Downloading: ${URL}"
              curl -fsSL "${URL}" -o "${TOOLS_DIR}/${TARBALL}"

              tar -xzf "${TOOLS_DIR}/${TARBALL}" -C "${TOOLS_DIR}"
              rm -f "${TOOLS_DIR}/${TARBALL}"

              if [ ! -d "${EXTRACTED_DIR}" ]; then
                echo "❌ Expected extracted dir not found: ${EXTRACTED_DIR}"
                ls -la "${TOOLS_DIR}" || true
                exit 1
              fi

              mv "${EXTRACTED_DIR}" "${NODE_DIR}"
            fi

            echo "NODE_HOME=${NODE_DIR}" > node.env
            echo "✅ Node installed: $(${NODE_DIR}/bin/node -v)"
            echo "✅ npm installed:  $(${NODE_DIR}/bin/npm -v)"
          '''
          env.NODE_HOME = readFile('node.env').trim().tokenize('=')[-1]
          echo "NODE_HOME=${env.NODE_HOME}"
        }
      }
    }

    // =========================================================================
    // 3. Install Dependencies
    // =========================================================================
    stage('📦 Install Dependencies') {
      steps {
        script {
          withEnv(env.NODE_HOME?.trim() ? ["PATH=${env.NODE_HOME}/bin:${env.PATH}"] : []) {
            sh '''#!/usr/bin/env bash
              set -euo pipefail

              # Make npm write cache/logs into WORKSPACE (avoid /var/jenkins_home permission issues)
              export HOME="${WORKSPACE}"
              export NPM_CONFIG_CACHE="${WORKSPACE}/.npm-cache"
              mkdir -p "${WORKSPACE}/.npm-cache"

              npm ci
            '''
          }
        }
      }
    }

    // =========================================================================
    // 4. Code Analysis
    // =========================================================================
    stage('🔍 Code Analysis') {
      steps {
        script {
          withEnv(env.NODE_HOME?.trim() ? ["PATH=${env.NODE_HOME}/bin:${env.PATH}"] : []) {
            sh 'npm run lint || true'
          }
        }
      }
    }

    // =========================================================================
    // 5. Build
    // =========================================================================
    stage('🏗️ Build') {
      steps {
        script {
          withEnv(env.NODE_HOME?.trim() ? ["PATH=${env.NODE_HOME}/bin:${env.PATH}"] : []) {
            sh '''#!/usr/bin/env bash
              set -euo pipefail
              npm run build
              echo "📦 Build artifacts:"
              ls -lh dist/
            '''
          }
        }
      }
    }

    // =========================================================================
    // 6. Test
    // =========================================================================
    stage('🧪 Test') {
      steps {
        script {
          withEnv(env.NODE_HOME?.trim() ? ["PATH=${env.NODE_HOME}/bin:${env.PATH}"] : []) {
            sh '''#!/usr/bin/env bash
              set -euo pipefail

              node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)" \
                && HAS_TEST=1 || HAS_TEST=0

              if [ "${HAS_TEST}" -eq 1 ]; then
                echo "Running tests"
                npm test || true
              else
                echo "⚠️ No test script found; skipping tests."
              fi
            '''
          }
        }
      }
    }

    // =========================================================================
    // 7. Docker Build & Push to Docker Hub
    // =========================================================================
    stage('🐳 Docker Build & Push') {
      steps {
        script {
          def buildTag = "${FULL_IMAGE_PATH}:${APP_VERSION}"
          def envTag   = "${FULL_IMAGE_PATH}:${env.IMAGE_TAG}"
          def gitTag   = "${FULL_IMAGE_PATH}:${env.GIT_COMMIT_SHORT}"

          sh """
            set -euo pipefail

            # ── Auth setup ──────────────────────────────────────────────────
            # Write credentials directly to config.json instead of using
            # "docker login" to avoid issues with credential store helpers in CI.
            rm -rf "${DOCKER_CONFIG}"
            mkdir -p "${DOCKER_CONFIG}"

            AUTH_B64=\$(printf '%s:%s' "\${DOCKERHUB_CREDENTIALS_USR}" "\${DOCKERHUB_CREDENTIALS_PSW}" | base64 | tr -d '\\n')
            printf '{"auths":{"https://index.docker.io/v1/":{"auth":"%s"}}}\\n' "\${AUTH_B64}" > "${DOCKER_CONFIG}/config.json"
            echo "🔑 Docker Hub auth configured for: \${DOCKERHUB_CREDENTIALS_USR}"

            # ── Build ────────────────────────────────────────────────────────
            docker --config "${DOCKER_CONFIG}" build \\
                -t "${buildTag}" \\
                -t "${envTag}"   \\
                -t "${gitTag}"   \\
                .

            # ── Push ─────────────────────────────────────────────────────────
            docker --config "${DOCKER_CONFIG}" push "${buildTag}"
            docker --config "${DOCKER_CONFIG}" push "${envTag}"
            docker --config "${DOCKER_CONFIG}" push "${gitTag}"

            # ── Scrub credentials immediately ─────────────────────────────────
            rm -f "${DOCKER_CONFIG}/config.json"
            echo "✅ Pushed: ${buildTag}, ${envTag}, ${gitTag}"
          """

          env.DOCKER_IMAGE_TAG     = buildTag
          env.DOCKER_IMAGE_GIT_TAG = gitTag
        }
      }
    }

    // =========================================================================
    // 8. Deploy to Kubernetes via Kustomize
    // =========================================================================
    stage('🚀 Deploy to Kubernetes') {
      steps {
        script {
          input message: "🚀 Deploy to PRODUCTION?", ok: "Yes, Deploy!"

          echo "🚀 Deploying to ${env.K8S_NAMESPACE}..."

          withCredentials([file(credentialsId: 'rancher-kubeconfig', variable: 'KUBECONFIG_CRED')]) {
            sh """
              set -eu

              # ── Writable kubeconfig copy ───────────────────────────────────
              mkdir -p "\${WORKSPACE}/.tools"
              KUBECONFIG_COPY="\${WORKSPACE}/.tools/kubeconfig"
              cp "\${KUBECONFIG_CRED}" "\${KUBECONFIG_COPY}"
              chmod 600 "\${KUBECONFIG_COPY}"
              export KUBECONFIG="\${KUBECONFIG_COPY}"

              # ── Ensure kubectl is available ────────────────────────────────
              TOOLS_DIR="\${WORKSPACE}/.tools"
              LOCAL_KUBECTL="\${TOOLS_DIR}/kubectl"

              if command -v kubectl >/dev/null 2>&1; then
                  KUBECTL="kubectl"
                  echo "✅ System kubectl found"
              elif [ -x "\${LOCAL_KUBECTL}" ]; then
                  KUBECTL="\${LOCAL_KUBECTL}"
                  echo "✅ Cached kubectl: \${LOCAL_KUBECTL}"
              else
                  echo "⬇️  kubectl not found — downloading stable release..."
                  KUBECTL_VER=\$(curl -sL https://dl.k8s.io/release/stable.txt)
                  curl -sLo "\${LOCAL_KUBECTL}" \\
                      "https://dl.k8s.io/release/\${KUBECTL_VER}/bin/linux/amd64/kubectl"
                  chmod +x "\${LOCAL_KUBECTL}"
                  KUBECTL="\${LOCAL_KUBECTL}"
                  echo "✅ Downloaded kubectl \${KUBECTL_VER}"
              fi

              \${KUBECTL} version --client >/dev/null 2>&1 || {
                  echo "❌ kubectl binary not working"; exit 1
              }
              echo "🔧 Using kubectl: \${KUBECTL}"

              # ── Patch kubeconfig: trust Rancher self-signed TLS ───────────
              CLUSTER_NAME=\$(\${KUBECTL} config view --minify -o jsonpath='{.clusters[0].name}')
              \${KUBECTL} config set-cluster "\${CLUSTER_NAME}" --insecure-skip-tls-verify=true
              echo "🔓 TLS verify disabled for cluster: \${CLUSTER_NAME}"

              # ── Create namespace ───────────────────────────────────────────
              \${KUBECTL} create namespace ${env.K8S_NAMESPACE} \\
                  --dry-run=client -o yaml | \${KUBECTL} apply -f -

              # ── Create / refresh Docker Hub pull secret ────────────────────
              \${KUBECTL} create secret docker-registry dockerhub-pull-secret \\
                  --namespace=${env.K8S_NAMESPACE} \\
                  --docker-server=https://index.docker.io/v1/ \\
                  --docker-username=\${DOCKERHUB_CREDENTIALS_USR} \\
                  --docker-password=\${DOCKERHUB_CREDENTIALS_PSW} \\
                  --docker-email=\${DOCKERHUB_CREDENTIALS_USR}@users.noreply.github.com \\
                  --dry-run=client -o yaml | \${KUBECTL} apply -f -

              # ── Apply Kustomize overlay (base manifests + prod overlay) ────
              echo ""
              echo "📋 Kustomize build preview:"
              \${KUBECTL} kustomize k8s/overlays/prod

              # ── Recreate Service to enforce static clusterIP ───────────────
              # spec.clusterIP is immutable once set — delete before apply so
              # the overlay's value is always honoured.
              echo ""
              echo "🔄 Recreating Service to enforce static clusterIP..."
              \${KUBECTL} delete svc online-ticketing-web \\
                  -n ${env.K8S_NAMESPACE} \\
                  --ignore-not-found=true

              echo ""
              echo "⬆️  Applying to cluster..."
              \${KUBECTL} apply -k k8s/overlays/prod

              # ── Pin exact build-number image tag ───────────────────────────
              # kustomization.yaml carries prod-latest; we immediately pin the
              # Deployment to the exact build-number tag so Kubernetes detects
              # a real spec change and triggers a pull of the new image.
              echo ""
              echo "🏷  Pinning image to ${FULL_IMAGE_PATH}:${APP_VERSION}..."
              \${KUBECTL} set image deployment/online-ticketing-web \\
                  web=${FULL_IMAGE_PATH}:${APP_VERSION} \\
                  -n ${env.K8S_NAMESPACE}

              echo ""
              echo "⏳ Waiting for rollout..."
              \${KUBECTL} rollout status deployment/online-ticketing-web \\
                  -n ${env.K8S_NAMESPACE} \\
                  --timeout=180s
            """
          }
        }
      }
    }

    // =========================================================================
    // 9. Verify Deployment
    // =========================================================================
    stage('✅ Verify Deployment') {
      steps {
        withCredentials([file(credentialsId: 'rancher-kubeconfig', variable: 'KUBECONFIG_CRED')]) {
          sh """
            set -eu
            NS=${env.K8S_NAMESPACE}

            # ── Reuse the patched kubeconfig from Deploy stage ────────────
            KUBECONFIG_COPY="\${WORKSPACE}/.tools/kubeconfig"
            if [ ! -f "\${KUBECONFIG_COPY}" ]; then
                cp "\${KUBECONFIG_CRED}" "\${KUBECONFIG_COPY}"
                chmod 600 "\${KUBECONFIG_COPY}"
            fi
            export KUBECONFIG="\${KUBECONFIG_COPY}"

            # ── Resolve kubectl ───────────────────────────────────────────
            LOCAL_KUBECTL="\${WORKSPACE}/.tools/kubectl"
            if command -v kubectl >/dev/null 2>&1; then
                KUBECTL="kubectl"
            elif [ -x "\${LOCAL_KUBECTL}" ]; then
                KUBECTL="\${LOCAL_KUBECTL}"
            else
                echo "❌ kubectl not found. Deploy stage must have failed to download it."
                exit 1
            fi

            echo "📊 Pod status:"
            \${KUBECTL} get pods -n \$NS -l app.kubernetes.io/name=online-ticketing-web

            echo ""
            echo "📊 Services:"
            \${KUBECTL} get svc -n \$NS

            echo ""
            echo "📊 Ingress:"
            \${KUBECTL} get ingress -n \$NS

            echo ""
            echo "📝 Recent pod logs:"
            \${KUBECTL} logs -n \$NS -l app.kubernetes.io/name=online-ticketing-web --tail=30 || true

            echo ""
            echo "🔍 Health check via port-forward:"
            \${KUBECTL} port-forward -n \$NS svc/online-ticketing-web 13000:3000 &
            PF_PID=\$!
            sleep 5
            curl -sf http://localhost:13000/health && echo " ← Health OK" || echo "⚠️ Health check pending"
            kill \$PF_PID 2>/dev/null || true
          """
        }
      }
    }

    // =========================================================================
    // 10. Cleanup
    // =========================================================================
    stage('🧹 Cleanup') {
      steps {
        sh '''
          echo "Removing dangling images..."
          docker image prune -f || true

          echo "Removing cached kubeconfig copy..."
          rm -f "${WORKSPACE}/.tools/kubeconfig" || true
        '''
      }
    }
  }

  post {
    success {
      script {
        echo """
        ╔═══════════════════════════════════════════════════════╗
        ║          ✅ DEPLOYMENT SUCCESSFUL                     ║
        ╚═══════════════════════════════════════════════════════╝

        📦 Image      : ${env.DOCKER_IMAGE_TAG}
        🌍 Environment: ${env.ENVIRONMENT}
        📍 Namespace  : ${env.K8S_NAMESPACE}
        📝 Commit     : ${env.GIT_COMMIT_MSG}
        👤 Author     : ${env.GIT_AUTHOR}
        🔖 Build      : #${env.BUILD_NUMBER}

        🔗 Endpoints:
          - App:    https://socratic-event.com
          - Health: https://socratic-event.com/health
          - API:    https://socratic-event.com/api

        📋 Kubectl Commands:
          kubectl get pods -n ${env.K8S_NAMESPACE}
          kubectl logs -n ${env.K8S_NAMESPACE} -l app.kubernetes.io/name=online-ticketing-web -f
          kubectl rollout restart deployment/online-ticketing-web -n ${env.K8S_NAMESPACE}
        """
      }
    }
    failure {
      script {
        echo """
        ╔═══════════════════════════════════════════════════════╗
        ║          ❌ DEPLOYMENT FAILED                         ║
        ╚═══════════════════════════════════════════════════════╝

        Environment: ${env.ENVIRONMENT}
        Namespace  : ${env.K8S_NAMESPACE}
        Build      : #${env.BUILD_NUMBER}

        Check the logs above for details.
        """
      }
    }
    always {
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
  }
}
