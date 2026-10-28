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
                // O Service Token fica guardado no Jenkins (credencial "infisical-token-prod").
                // A CLI do Infisical lê sozinha a variável INFISICAL_TOKEN, então não
                // precisa de --token nem de --projectId.
                withCredentials([string(credentialsId: 'infisical-token-prod', variable: 'INFISICAL_TOKEN')]) {
                    bat 'npx -y @infisical/cli run --env=prod --path=/ -- docker-compose up -d --build'
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