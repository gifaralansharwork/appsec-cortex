// pipeline {
//     agent none
//     options { timestamps(); timeout(time: 15, unit: 'MINUTES') }

//     environment {
//         CORTEX_API_URL = 'https://api-bismillah-ecip.xdr.us.paloaltonetworks.com'
//         REPO_ID        = 'gifaralansharwork/appsec-cortex'
//     }

//     stages {
//         stage('Info') {
//             agent any
//             steps {
//                 echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
//                 echo "Commit: ${env.GIT_COMMIT}"
//             }
//         }

//         stage('Code Test') {
//             agent { docker { image 'python:3.12-slim' } }
//             environment {
//                 HOME = "${env.WORKSPACE}"
//                 PIP_DISABLE_PIP_VERSION_CHECK = '1'
//             }
//             steps {
//                 sh '''
//                     python -m venv .venv
//                     . .venv/bin/activate
//                     pip install --quiet pytest
//                     pytest -v --junitxml=results.xml || [ $? -eq 5 ]
//                 '''
//             }
//             post {
//                 always {
//                     junit allowEmptyResults: true, testResults: 'results.xml'
//                 }
//             }
//         }

//         stage('Cortex Code Scan') {
//             agent any
//             environment {
//                 CORTEX_TOOLS = "${env.JENKINS_HOME}/tools/cortex"
//             }
//             steps {
//                 withCredentials([
//                     string(credentialsId: 'CORTEX_API_KEY',    variable: 'CORTEX_API_KEY'),
//                     string(credentialsId: 'CORTEX_API_KEY_ID', variable: 'CORTEX_API_KEY_ID')
//                 ]) {
//                     sh '''
//                         set +x
//                         set -u
//                         mkdir -p "$CORTEX_TOOLS"
//                         ARCH=$(uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')

//                         # jq (static binary, no apt needed)
//                         if [ ! -x "$CORTEX_TOOLS/jq" ]; then
//                           curl -sSfL -o "$CORTEX_TOOLS/jq" "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-$ARCH"
//                           chmod +x "$CORTEX_TOOLS/jq"
//                         fi

//                         # cortexcli (re-download if missing or older than 1 day)
//                         if [ ! -x "$CORTEX_TOOLS/cortexcli" ] || [ -n "$(find "$CORTEX_TOOLS/cortexcli" -mtime +0)" ]; then
//                           TMP=$(mktemp -d)
//                           HTTP=$(curl -sS -o "$TMP/resp.json" -w '%{http_code}' \
//                             "$CORTEX_API_URL/public_api/v1/unified-cli/releases/download-link?os=linux&architecture=$ARCH" \
//                             --header "Authorization: $CORTEX_API_KEY" \
//                             --header "x-xdr-auth-id: $CORTEX_API_KEY_ID")
//                           echo "download-link HTTP $HTTP"
//                           [ "$HTTP" = "200" ] || { head -c 300 "$TMP/resp.json"; echo; exit 1; }

//                           URL=$("$CORTEX_TOOLS/jq" -r '.signed_url // empty' "$TMP/resp.json")
//                           [ -n "$URL" ] || { echo "signed_url missing in response"; exit 1; }

//                           curl -sSfL -o "$TMP/dl" "$URL"
//                           if tar -tzf "$TMP/dl" >/dev/null 2>&1; then
//                             tar -xzf "$TMP/dl" -C "$TMP"
//                             BIN=$(find "$TMP" -type f -name cortexcli | head -1)
//                           else
//                             BIN="$TMP/dl"
//                           fi
//                           install -m 0755 "$BIN" "$CORTEX_TOOLS/cortexcli"
//                           rm -rf "$TMP"
//                         fi
//                         "$CORTEX_TOOLS/cortexcli" --version

//                         BRANCH="${BRANCH_NAME:-${GIT_BRANCH#origin/}}"
//                         REPO_URL="${GIT_URL:-https://github.com/$REPO_ID}"

//                         "$CORTEX_TOOLS/cortexcli" \
//                           --api-base-url "$CORTEX_API_URL" \
//                           --api-key "$CORTEX_API_KEY" \
//                           --api-key-id "$CORTEX_API_KEY_ID" \
//                           --upload-mode upload \
//                           code scan \
//                           --directory "$(pwd)" \
//                           --repo-id "$REPO_ID" \
//                           --branch "$BRANCH" \
//                           --source "JENKINS" \
//                           --repo-url "$REPO_URL"
//                     '''
//                 }
//             }
//         }
//     }
// }



pipeline {
    agent {
        docker {
            image 'cimg/node:22.17.0' // Replace with a suitable image or executor
            args '-u root'
        }
    }

    environment {
        CORTEX_API_KEY = credentials('CORTEX_API_KEY')
        CORTEX_API_KEY_ID = credentials('CORTEX_API_KEY_ID')
        CORTEX_API_URL = 'https://api-bismillah-ecip.xdr.us.paloaltonetworks.com'
    }

    stages {
        stage('Info') {
            agent any
            steps {
                echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Code Test') {
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
                    pytest -v --junitxml=results.xml || [ $? -eq 5 ]
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'results.xml'
                }
            }
        }

        stage('Checkout Repository') {
            steps{
                git branch: 'main', url: 'https://github.com/gifaralansharwork/appsec-cortex'
                stash includes: '**/*', name: 'source'
            }
        }
        
        stage('Run Scan') {
        // Replace the repo-id with your repository like: owner/repo
            steps {
                script {
                    // unstash 'source'
                    sh """
                    ./cortexcli \
                      --api-base-url "${env.CORTEX_API_URL}" \
                      --api-key "${env.CORTEX_API_KEY}" \
                      --api-key-id "${env.CORTEX_API_KEY_ID}" \
                      code scan \
                      --directory "\$(pwd)" \
                      --repo-id gifaralansharwork/appsec-cortex \
                      --branch main \
                      --source "JENKINS" \
                      --repo-url https://github.com/gifaralansharwork/appsec-cortex
                    """
                }
            }
        }
    }
}

// pipeline {
//     agent none
//     options { timestamps(); timeout(time: 15, unit: 'MINUTES') }

//     environment {
//         CORTEX_API_URL = 'https://api-bismillah-ecip.xdr.us.paloaltonetworks.com'
//         REPO_ID        = 'gifaralansharwork/appsec-cortex'
//         CORTEX_CLI     = '/var/jenkins_home/tools/cortex/cortexcli'
//     }

//     stages {
//         stage('Info') {
//             agent any
//             steps {
//                 echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
//                 echo "Commit: ${env.GIT_COMMIT}"
//             }
//         }

//         stage('Code Test') {
//             agent { docker { image 'python:3.12-slim' } }
//             environment {
//                 HOME = "${env.WORKSPACE}"
//                 PIP_DISABLE_PIP_VERSION_CHECK = '1'
//             }
//             steps {
//                 sh '''
//                     python -m venv .venv
//                     . .venv/bin/activate
//                     pip install --quiet pytest
//                     pytest -v --junitxml=results.xml || [ $? -eq 5 ]
//                 '''
//             }
//             post {
//                 always { junit allowEmptyResults: true, testResults: 'results.xml' }
//             }
//         }

//         stage('Cortex Code Scan') {
//             agent any
//             steps {
//                 withCredentials([
//                     string(credentialsId: 'CORTEX_API_KEY',    variable: 'CORTEX_API_KEY'),
//                     string(credentialsId: 'CORTEX_API_KEY_ID', variable: 'CORTEX_API_KEY_ID')
//                 ]) {
//                     sh '''
//                         set +x
//                         [ -x "$CORTEX_CLI" ] || { echo "cortexcli not found or not executable at $CORTEX_CLI"; exit 1; }
//                         "$CORTEX_CLI" --version

//                         BRANCH="${BRANCH_NAME:-${GIT_BRANCH#origin/}}"
//                         REPO_URL="${GIT_URL:-https://github.com/$REPO_ID}"

//                         "$CORTEX_CLI" \
//                           --api-base-url "$CORTEX_API_URL" \
//                           --api-key "$CORTEX_API_KEY" \
//                           --api-key-id "$CORTEX_API_KEY_ID" \
//                           --upload-mode upload \
//                           code scan \
//                           --directory "$(pwd)" \
//                           --repo-id "$REPO_ID" \
//                           --branch "$BRANCH" \
//                           --source "JENKINS" \
//                           --repo-url "$REPO_URL"
//                     '''
//                 }
//             }
//         }
//     }
// }