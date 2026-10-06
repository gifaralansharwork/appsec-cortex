pipeline{
    agent none
    options { timestamps(); timeout(time: 10, unit: 'MINUTES')}

    stages{
        stage("info"){
            agent any
            steps{
                echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
                echo "Commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Test') {
            agent { docker { image 'python:3.12-slim' } }
            environment {
                HOME = "${env.WORKSPACE}"          // gives pip/pytest a writable home
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
    }
}