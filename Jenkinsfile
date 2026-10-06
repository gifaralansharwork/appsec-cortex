pipeline {
    agent none
    options { timestamps(); timeout(time: 15, unit: 'MINUTES') }

    environment {
        CORTEX_API_URL = 'https://api-bismillah-ecip.xdr.us.paloaltonetworks.com'
        REPO_ID        = 'gifaralansharwork/appsec-cortex'
    }

    stages {
        stage('info') {
            agent any
            steps {
                echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Checks') {
            parallel {

                stage('Test') {
                    agent { docker { image 'python:3.12-slim' } }
                    environment {
                        HOME = "${env.WORKSPACE}"
                        PIP_DISABLE_PIP_VERSION_CHECK = '1'
                    }
                    steps {
                        sh '''
                            python -m venv .venv
                            . .venv/bin/activate
                            pip install --quiet pytest
                            pytest -v --junitxml=results.xml
                        '''
                    }
                    post {
                        always {
                            junit allowEmptyResults: true, testResults: 'results.xml'
                        }
                    }
                }

                stage('Cortex Code Scan') {
                    agent any
                    environment {
                        CORTEX_API_KEY    = credentials('CORTEX_API_KEY')
                        CORTEX_API_KEY_ID = credentials('CORTEX_API_KEY_ID')
                        CORTEX_TOOLS      = "${env.JENKINS_HOME}/tools/cortex"
                    }
                    steps {
                        sh '''
                            set +x
                            set -eu
                            mkdir -p "$CORTEX_TOOLS"
                            case "$(uname -m)" in
                              x86_64)        ARCH=amd64 ;;
                              aarch64|arm64) ARCH=arm64 ;;
                              *) echo "Unsupported arch"; exit 1 ;;
                            esac

                            if [ ! -x "$CORTEX_TOOLS/jq" ]; then
                              curl -sSfL -o "$CORTEX_TOOLS/jq" "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-$ARCH"
                              chmod +x "$CORTEX_TOOLS/jq"
                            fi

                            if [ -x "$CORTEX_TOOLS/cortexcli" ] && [ -z "$(find "$CORTEX_TOOLS/cortexcli" -mtime +0)" ]; then
                              echo "Using cached cortexcli"
                            else
                              RESP=$(curl -sSf "$CORTEX_API_URL/public_api/v1/unified-cli/releases/download-link?os=linux&architecture=$ARCH" \
                                       --header "Authorization: $CORTEX_API_KEY" \
                                       --header "x-xdr-auth-id: $CORTEX_API_KEY_ID")
                              URL=$(echo "$RESP" | "$CORTEX_TOOLS/jq" -r '.signed_url')
                              [ -n "$URL" ] && [ "$URL" != "null" ] || { echo "No download link in response"; exit 1; }

                              TMP=$(mktemp -d)
                              curl -sSfL -o "$TMP/dl" "$URL"
                              if tar -tzf "$TMP/dl" >/dev/null 2>&1; then
                                tar -xzf "$TMP/dl" -C "$TMP"
                                BIN=$(find "$TMP" -type f -name cortexcli | head -1)
                              else
                                BIN="$TMP/dl"
                              fi
                              install -m 0755 "$BIN" "$CORTEX_TOOLS/cortexcli"
                              rm -rf "$TMP"
                            fi
                            "$CORTEX_TOOLS/cortexcli" --version
                        '''

                        sh '''
                            set +x
                            BRANCH="${BRANCH_NAME:-${GIT_BRANCH#origin/}}"
                            REPO_URL="${GIT_URL:-https://github.com/$REPO_ID}"

                            "$CORTEX_TOOLS/cortexcli" \
                              --api-base-url "$CORTEX_API_URL" \
                              --api-key "$CORTEX_API_KEY" \
                              --api-key-id "$CORTEX_API_KEY_ID" \
                              --upload-mode upload \
                              code scan \
                              --directory "$(pwd)" \
                              --repo-id "$REPO_ID" \
                              --branch "$BRANCH" \
                              --source "JENKINS" \
                              --repo-url "$REPO_URL"
                        '''
                    }
                }
            }
        }
    }
}