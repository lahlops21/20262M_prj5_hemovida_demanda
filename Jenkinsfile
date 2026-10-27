pipeline {
    agent any

    stages {
        stage('Verificar Repositório') {
            steps {
                // TROQUE pela URL do repositório do seu projeto
                checkout([$class: 'GitSCM',
                    branches: [[name: '*/main']],
                    useRemoteConfigs: [[url: 'https://github.com/lahlops21/20262M_prj5_hemovida_demanda']]
                ])
            }
        }

        stage('Instalar Dependências') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Testes') {
            steps {
                bat 'npm test'
            }
        }

        stage('Construir Imagem Docker') {
            steps {
                bat "docker build -t hemovida-api:${env.BUILD_ID} ."
            }
        }

        stage('Fazer Deploy') {
            steps {
                // Para e remove o container antigo, se existir
                bat 'docker stop hemovida-api || exit 0'
                bat 'docker rm -v hemovida-api || exit 0'

                // O "infisical run" injeta DATABASE_URL e JWT_SECRET no docker-compose,
                // sem escrever nenhum .env em disco.
                // A Machine Identity usa Client ID + Client Secret. O pipeline troca os dois
                // por um token temporário e usa esse token no "infisical run".
                withCredentials([
                    string(credentialsId: 'infisical-client-id', variable: 'INFISICAL_CLIENT_ID'),
                    string(credentialsId: 'infisical-client-secret', variable: 'INFISICAL_CLIENT_SECRET')
                ]) {
                    script {
                        def token = bat(
                            returnStdout: true,
                            script: '@npx -y @infisical/cli login --method=universal-auth --client-id=%INFISICAL_CLIENT_ID% --client-secret=%INFISICAL_CLIENT_SECRET% --silent --plain'
                        ).trim()

                        withEnv(["INFISICAL_TOKEN=${token}"]) {
                            // TROQUE pelo ID do seu projeto (Project Settings no Infisical)
                            bat 'npx -y @infisical/cli run --env=prod --path=/ --projectId=COLE-AQUI-O-ID-DO-PROJETO -- docker-compose up -d --build'
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Deploy realizado com sucesso!'
        }
        failure {
            echo 'Houve um erro durante o deploy.'
        }
    }
}