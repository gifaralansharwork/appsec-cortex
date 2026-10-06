pipeline {
    agent none
    options { timestamps(); timeout(time: 15, unit: 'MINUTES') }

    environment {
        CORTEX_API_KEY = 'wPNdUcYCdoLB7lDKtMN4Gy8VfC0Jjlz7wklC8nizbGJaf4OSXDw5pgq2ta3erONOnpwCGVioSYcthQTjplpZSv0Myj9DLqwR2X19rfDrqak3daICCIgRBxo74ezk5e24'
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
                always { junit allowEmptyResults: true, testResults: 'results.xml' }
            }
        }

        stage('Run Scan') {
            agent any
            steps {
                script{
                    sh """
                    whoami
                    pwd
                    cp /var/jenkins_home/tools/cortex/cortexcli ./cortexcli
                    chmod 755 ./cortexcli
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