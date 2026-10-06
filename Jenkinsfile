// pipeline {
//     agent {
//         docker {
//             image 'cimg/node:22.17.0' // Replace with a suitable image or executor
//             args '-u root'
//         }
//     }

//     environment {
//         CORTEX_API_KEY = credentials('CORTEX_API_KEY')
//         CORTEX_API_KEY_ID = credentials('CORTEX_API_KEY_ID')
//         CORTEX_API_URL = 'https://api-bismillah-ecip.xdr.us.paloaltonetworks.com'
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

//         stage('Checkout Repository') {
//             steps{
//                 git branch: 'main', url: 'https://github.com/gifaralansharwork/appsec-cortex'
//                 stash includes: '**/*', name: 'source'
//             }
//         }
        
//         stage('Run Scan') {
//         // Replace the repo-id with your repository like: owner/repo
//             steps {
//                 script {
//                     // unstash 'source'
//                     sh """
//                     ./cortexcli \
//                       --api-base-url "${env.CORTEX_API_URL}" \
//                       --api-key "${env.CORTEX_API_KEY}" \
//                       --api-key-id "${env.CORTEX_API_KEY_ID}" \
//                       code scan \
//                       --directory "\$(pwd)" \
//                       --repo-id gifaralansharwork/appsec-cortex \
//                       --branch main \
//                       --source "JENKINS" \
//                       --repo-url https://github.com/gifaralansharwork/appsec-cortex
//                     """
//                 }
//             }
//         }
//     }
// }

pipeline {
    agent none
    options { timestamps(); timeout(time: 15, unit: 'MINUTES') }

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
                withCredentials([
                    string(credentialsId: 'CORTEX_API_KEY',    variable: 'CORTEX_API_KEY'),
                    string(credentialsId: 'CORTEX_API_KEY_ID', variable: 'CORTEX_API_KEY_ID')
                ]) {
                    sh '''
                        set +x
                        id
                        /var/jenkins_home/tools/cortex/cortexcli \
                          --api-base-url "https://api-bismillah-ecip.xdr.us.paloaltonetworks.com" \
                          --api-key "$CORTEX_API_KEY" \
                          --api-key-id "$CORTEX_API_KEY_ID" \
                          code scan \
                          --directory "$(pwd)" \
                          --repo-id gifaralansharwork/appsec-cortex \
                          --branch main \
                          --source JENKINS \
                          --repo-url https://github.com/gifaralansharwork/appsec-cortex
                    '''
                }
            }
        }
    }
}