pipeline {
    agent none
    options { timestamps(); timeout(time: 15, unit: 'MINUTES') }

    environment {
        CORTEX_API_KEY =  credentials('CORTEX_API_KEY')
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

        // stage('Run Scan') {
        //     agent any
        //     steps {
        //         script{
        //             sh """
        //             whoami
        //             pwd
        //             cp /var/jenkins_home/tools/cortex/cortexcli ./cortexcli
        //             chmod 755 ./cortexcli
        //             ./cortexcli \
        //               --api-base-url "${env.CORTEX_API_URL}" \
        //               --api-key "${env.CORTEX_API_KEY}" \
        //               --api-key-id "${env.CORTEX_API_KEY_ID}" \
        //               code scan \
        //               --directory "\$(pwd)" \
        //               --repo-id gifaralansharwork/appsec-cortex \
        //               --branch main \
        //               --source "JENKINS" \
        //               --repo-url https://github.com/gifaralansharwork/appsec-cortex
        //             """
        //         }
        //     }
        // }

        stage('Image Scan') {
            agent any
            steps {
                script{
                    sh'''
                    whoami
                    pwd
                    IMG="base-test:$BUILD_NUMBER"
                    docker build -q -t "$IMG" .
                    cp /var/jenkins_home/tools/cortex/cortexcli ./cortexcli
                    chmod 755 ./cortexcli
                    ./cortexcli --upload-mode upload --api-base-url "${CORTEX_API_URL}" --api-key "${CORTEX_API_KEY}" --api-key-id "${CORTEX_API_KEY_ID}" \
                    image scan base-test:69
                    '''
                }
            }
        }
    }
}