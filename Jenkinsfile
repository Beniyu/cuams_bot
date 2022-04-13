pipeline {
	agent any
	
	stages {
		stage('SCM') {
			steps { 
				script {
					checkout scm
				}
			}
		}

		stage('Run Jest Tests') {
		    steps {
		        dir("application") {
		            sh "npm install --development"
                	sh "npm test"
		        }
		    }
		}
		
		stage('SonarQube Analysis') {
			steps {
				script {
					def scannerHome = tool 'SonarScanner';
					withSonarQubeEnv() {
						sh "${scannerHome}/bin/sonar-scanner"
					}	
				}
			}
		}

        stage('Close Current Staging Environment') {
            steps {
                sh "docker-compose down"
            }
        }
		
		stage('Migrate Database')
		{
			steps {
				sh "npm install mongodb fs"
				sh "node ./database/migrateDatabase.js staging"
			}
		}
		
		stage('Deploy to Staging Environment') {
			steps {
				sh "docker-compose build"
				sh "docker-compose up -d"
			}
		}
	}
	
}
		